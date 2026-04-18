import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

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
      try {
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
      } catch (error) {
        console.error('Yahoo Finance error:', error);
      }
    }

    // 2. TEFAS/BEFAS Fetcher (Netlify logic applied to Vercel)
    if (fundSymbols.length > 0) {
      try {
        const fetchFund = async (symbol: string) => {
          const url = 'https://www.tefas.gov.tr/api/DB/GetAllFundAnalyzeData';
          const body = `dil=TR&fonkod=${symbol}`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7', // Added from Netlify project
              'Origin': 'https://www.tefas.gov.tr', // Added from Netlify project
              'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx', // Added from Netlify project
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'X-Requested-With': 'XMLHttpRequest', // Critical for TEFAS
            },
            body: body
          });

          // Check if it's returning HTML (WAF block)
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            console.warn(`TEFAS WAF blocked request for ${symbol}`);
            return null;
          }

          if (!response.ok) return null;
          
          const data = await response.json();
          if (!data || !data.fundInfo || data.fundInfo.length === 0) return null;

          const info = data.fundInfo[0];
          return {
            symbol: symbol,
            type: 'TEFAS',
            price: parseFloat(info.SONFIYAT || '0'),
            name: info.FONUNVAN,
            changePercent: parseFloat(info.GUNLUKGETIRI || '0'),
            source: 'tefas'
          };
        };

        const fundResults = await Promise.all(fundSymbols.map(fetchFund));
        const validFundResults = fundResults.filter(r => r !== null);
        finalResults = [...finalResults, ...validFundResults];
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
