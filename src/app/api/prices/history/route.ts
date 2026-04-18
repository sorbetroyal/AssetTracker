import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();
const TEFAS_API_URL = process.env.TEFAS_API_URL ?? '';

async function fetchTefasHistoryViaPythonService(
  symbol: string,
  date: string
): Promise<number | null> {
  if (!TEFAS_API_URL) return null;
  try {
    const url = `${TEFAS_API_URL}/price?symbol=${symbol}&date=${date}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.price ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const dateStr = searchParams.get('date');
  const type = searchParams.get('type');

  if (!symbol || !dateStr) {
    return NextResponse.json(
      { error: 'Symbol and Date are required' },
      { status: 400 }
    );
  }

  try {
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. TEFAS / BEFAS → Render.com Python servisi
    if (type === 'TEFAS' || type === 'BEFAS') {
      const price = await fetchTefasHistoryViaPythonService(symbol, dateStr);
      if (price !== null) {
        return NextResponse.json({ price });
      }
      return NextResponse.json({ error: 'Fon fiyatı bulunamadı' }, { status: 404 });
    }

    // 2. Diğerleri → Yahoo Finance
    // Bugün ise anlık fiyat
    if (targetDate.getTime() >= today.getTime()) {
      const quote = await yf.quote(symbol);
      return NextResponse.json({ price: quote.regularMarketPrice });
    }

    // Geçmiş tarih → hafta sonu / tatil toleransı için 10 günlük pencere
    const period1 = new Date(targetDate);
    period1.setDate(period1.getDate() - 10);

    const period2 = new Date(targetDate);
    period2.setDate(period2.getDate() + 1);

    const result = await yf.historical(symbol, {
      period1,
      period2,
      interval: '1d',
    });

    if (result && result.length > 0) {
      const last = result[result.length - 1];
      return NextResponse.json({ price: last.close });
    }

    return NextResponse.json(
      { error: 'No data for this date range' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[History API] Hata:', err.message);
    return NextResponse.json({ error: 'Price lookup failed' }, { status: 500 });
  }
}
