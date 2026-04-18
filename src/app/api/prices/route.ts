import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const yf = new YahooFinance();

// Python yolunu Windows için uygun hale getir
const PYTHON_PATH = 'python'; // Eğer sistemde 'python3' ise değiştirilebilir
const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'fetch_funds.py');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairsParam = searchParams.get('pairs');
  if (!pairsParam) return NextResponse.json({ error: 'No pairs provided' }, { status: 400 });

  const pairs = pairsParam.split(',');
  const fundPairs = pairs.filter(p => p.startsWith('TEFAS:') || p.startsWith('BEFAS:'));
  const otherPairs = pairs.filter(p => !p.startsWith('TEFAS:') && !p.startsWith('BEFAS:'));

  const fundSymbols = fundPairs.map(p => p.split(':')[1]);
  const otherSymbols = otherPairs.map(p => p.split(':')[1]);
  const otherTypes = otherPairs.reduce((acc: any, p) => {
    const [type, sym] = p.split(':');
    acc[sym] = type;
    return acc;
  }, {});

  try {
    let finalResults: any[] = [];

    // 1. Yahoo Finance (Hisse, Kripto, US, Index)
    if (otherSymbols.length > 0) {
      const quotes = await yf.quote(otherSymbols);
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      
      const yahooResults = quotesArray.map(quote => {
        const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.regularMarketPreviousClose ?? 0;
        const prevClose = quote.regularMarketPreviousClose ?? price;
        
        let changePercent = quote.regularMarketChangePercent;
        if ((!changePercent || changePercent === 0) && price !== prevClose && prevClose > 0) {
          changePercent = ((price - prevClose) / prevClose) * 100;
        }

        return {
          symbol: quote.symbol,
          type: otherTypes[quote.symbol],
          price: price,
          name: quote.shortName || quote.longName,
          changePercent: changePercent ?? 0,
          source: 'yahoo'
        };
      });
      finalResults = [...finalResults, ...yahooResults];
    }

    // 2. borsapy (TEFAS/BEFAS Fonları)
    if (fundSymbols.length > 0) {
      try {
        const { stdout } = await execAsync(`${PYTHON_PATH} "${SCRIPT_PATH}" "${fundSymbols.join(',')}"`);
        const borsaResults = JSON.parse(stdout);
        // Tip bilgisini ekle
        const typedBorsaResults = borsaResults.map((r: any) => ({ ...r, type: 'TEFAS' }));
        finalResults = [...finalResults, ...typedBorsaResults];
      } catch (error) {
        console.error('Fund fetch error:', error);
      }
    }

    return NextResponse.json(finalResults);
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: 'Veri çekilirken bir hata oluştu.' }, { status: 500 });
  }
}
