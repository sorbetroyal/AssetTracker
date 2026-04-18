import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const yf = new YahooFinance();

const PYTHON_PATH = 'python';
const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'fetch_funds.py');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const dateStr = searchParams.get('date');
  const type = searchParams.get('type');

  if (!symbol || !dateStr) {
    return NextResponse.json({ error: 'Symbol and Date are required' }, { status: 400 });
  }

  try {
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. TEFAS / BEFAS ise borsapy kullan 
    // Not: Fon fiyatları genellikle bir önceki günün kapanışıdır
    if (type === 'TEFAS' || type === 'BEFAS') {
      try {
        const { stdout } = await execAsync(`${PYTHON_PATH} "${SCRIPT_PATH}" "${symbol}" "${dateStr}"`);
        const results = JSON.parse(stdout);
        if (results.length > 0 && !results[0].error) {
          return NextResponse.json({ price: results[0].price });
        }
      } catch (e) {
        console.error('Fund History Error:', e);
      }
    }

    // 2. Diğerleri için Yahoo Finance (BIST, US, CRYPTO)
    // Bugün ise anlık fiyat
    if (targetDate.getTime() >= today.getTime()) {
      const quote = await yf.quote(symbol);
      return NextResponse.json({ price: quote.regularMarketPrice });
    }

    // Geçmiş tarih ise: HAFTA SONU / TATİL KONTROLÜ
    // Seçilen tarihten 10 gün öncesine kadar olan verileri çekiyoruz
    const period1 = new Date(targetDate);
    period1.setDate(period1.getDate() - 10); // 10 gün geriye bak
    
    // Period2, seçilen tarihin 1 gün sonrası (veriyi kapsamak için)
    const period2 = new Date(targetDate);
    period2.setDate(period2.getDate() + 1);

    const result = await yf.historical(symbol, {
      period1: period1,
      period2: period2,
      interval: '1d'
    });

    if (result && result.length > 0) {
      // Bulunan sonuçlar içinden SEÇİLEN TARİHE EN YAKIN (SON) veriyi al
      const lastAvailable = result[result.length - 1];
      return NextResponse.json({ price: lastAvailable.close });
    } 

    return NextResponse.json({ error: 'No data for this date range' }, { status: 404 });

  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Price lookup failed' }, { status: 500 });
  }
}
