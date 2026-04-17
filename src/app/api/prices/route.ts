import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',');

  try {
    const quotes = await yf.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const results = await Promise.all(quotesArray.map(async (quote) => {
      let last4hPrice = quote.regularMarketPrice;
      const isBIST = quote.symbol.endsWith('.IS');
      const isMarketOpen = quote.marketState === 'REGULAR';

      try {
        const period1 = new Date();
        period1.setDate(period1.getDate() - 3);
        const chart = await yf.chart(quote.symbol, { interval: '1h', period1 }).catch(() => null);
        
        if (chart && chart.quotes) {
          const valid = chart.quotes.filter((q: any) => q.close !== null && q.close !== undefined);
          if (valid.length > 0) {
            if (isBIST) {
              const tvBist = valid.filter((q: any) => {
                const hour = new Date(q.date).getUTCHours();
                return hour === 11 || hour === 15;
              });
              if (!isMarketOpen) {
                last4hPrice = quote.regularMarketPrice;
              } else {
                last4hPrice = tvBist.length > 0 ? tvBist[tvBist.length - 1].close : valid[valid.length - 1].close;
              }
            } else {
              const tvOthers = valid.filter((q: any) => (new Date(q.date).getUTCHours() % 4 === 0));
              last4hPrice = tvOthers.length > 0 ? tvOthers[tvOthers.length - 1].close : valid[valid.length - 1].close;
            }
          }
        }
      } catch (e) {
        console.warn('Chart fetch failed for', quote.symbol);
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        last4hPrice: last4hPrice,
        name: quote.shortName || quote.longName,
        changePercent: quote.regularMarketChangePercent
      };
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('API Error:', error.message);
    
    if (error.code === 429 || error.message?.includes('Too Many Requests')) {
      return NextResponse.json(
        { error: 'Yahoo Finance limitine yakalandı. Lütfen biraz bekleyin.' }, 
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Veri çekilirken bir hata oluştu.' }, 
      { status: 500 }
    );
  }
}
