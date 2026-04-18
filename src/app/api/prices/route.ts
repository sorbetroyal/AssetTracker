import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { fetchTefasPrices } from '@/lib/tefas';

const yf = new YahooFinance();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairsParam = searchParams.get('pairs');
  if (!pairsParam) {
    return NextResponse.json({ error: 'No pairs provided' }, { status: 400 });
  }

  const pairs = pairsParam.split(',');

  // TEFAS / BEFAS ayrıştır
  const fundPairs = pairs.filter(
    (p) => p.startsWith('TEFAS:') || p.startsWith('BEFAS:')
  );
  const fundMeta = fundPairs.map((p) => {
    const [type, symbol] = p.split(':');
    return { type, symbol };
  });

  // Diğer enstrümanlar (Yahoo Finance)
  const otherPairs = pairs.filter(
    (p) => !p.startsWith('TEFAS:') && !p.startsWith('BEFAS:')
  );
  const otherSymbols = otherPairs.map((p) => p.split(':')[1]);
  const typeBySymbol: Record<string, string> = {};
  otherPairs.forEach((p) => {
    const [type, sym] = p.split(':');
    typeBySymbol[sym] = type;
  });

  try {
    const finalResults: any[] = [];

    // 1. Yahoo Finance (BIST, US, Crypto vb.)
    if (otherSymbols.length > 0) {
      try {
        const quotes = await yf.quote(otherSymbols);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        quotesArray.forEach((q) => {
          finalResults.push({
            symbol: q.symbol,
            type: typeBySymbol[q.symbol],
            price:
              q.regularMarketPrice ??
              q.postMarketPrice ??
              q.regularMarketPreviousClose ??
              0,
            name: q.shortName ?? q.longName,
            changePercent: q.regularMarketChangePercent ?? 0,
            source: 'yahoo',
          });
        });
      } catch (err) {
        console.error('[Yahoo] Hata:', err);
      }
    }

    // 2. TEFAS / BEFAS → fundturkey.com.tr (saf TypeScript, Python yok)
    if (fundMeta.length > 0) {
      const symbols = fundMeta.map((f) => f.symbol);
      const tefasResults = await fetchTefasPrices(symbols);

      tefasResults.forEach((r) => {
        const meta = fundMeta.find((f) => f.symbol === r.symbol);
        finalResults.push({ ...r, type: meta?.type ?? 'TEFAS' });
      });
    }

    return NextResponse.json(finalResults);
  } catch (err: any) {
    console.error('[Prices API] Kritik hata:', err.message);
    return NextResponse.json(
      { error: 'Veri işleme sırasında hata oluştu.' },
      { status: 500 }
    );
  }
}
