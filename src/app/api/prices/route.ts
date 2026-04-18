import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

/**
 * TEFAS/BEFAS Veri Çekici
 * Netlify (Streamlit) projesindeki başarılı mantık ve borsapy kütüphanesi 
 * temel alınarak Node.js ortamına optimize edilmiştir.
 */
async function fetchTefasData(symbol: string, type: string) {
  const url = 'https://www.tefas.gov.tr/api/DB/GetAllFundAnalyzeData';
  
  // URLSearchParams kullanımı: application/x-www-form-urlencoded için en güvenli yoldur.
  const body = new URLSearchParams();
  body.append('dil', 'TR');
  body.append('fonkod', symbol);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://www.tefas.gov.tr',
        'Pragma': 'no-cache',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body.toString()
    });

    if (!response.ok) {
      console.error(`TEFAS Error [${symbol}]: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.warn(`TEFAS WAF/HTML detected for ${symbol}. Likely IP Blocked.`);
      return null;
    }

    const data = await response.json();
    if (!data || !data.fundInfo || data.fundInfo.length === 0) {
      console.warn(`TEFAS No Data for ${symbol}`);
      return null;
    }

    const info = data.fundInfo[0];
    return {
      symbol: symbol,
      type: type,
      price: parseFloat(info.SONFIYAT || '0'),
      name: info.FONUNVAN,
      changePercent: parseFloat(info.GUNLUKGETIRI || '0'),
      source: 'tefas'
    };
  } catch (error: any) {
    console.error(`TEFAS Fetch Failed [${symbol}]:`, error.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairsParam = searchParams.get('pairs');
  if (!pairsParam) return NextResponse.json({ error: 'No pairs provided' }, { status: 400 });

  const pairs = pairsParam.split(',');
  
  // Fonları ayrıştır
  const fundPairs = pairs.filter(p => p.startsWith('TEFAS:') || p.startsWith('BEFAS:'));
  const fundSymbolsWithTypes = fundPairs.map(p => {
    const [type, symbol] = p.split(':');
    return { type, symbol };
  });

  // Diğer varlıkları (Yahoo) ayrıştır
  const otherPairs = pairs.filter(p => !p.startsWith('TEFAS:') && !p.startsWith('BEFAS:'));
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

    // 2. TEFAS/BEFAS İşlemleri
    if (fundSymbolsWithTypes.length > 0) {
      const fundResults = await Promise.all(
        fundSymbolsWithTypes.map(item => fetchTefasData(item.symbol, item.type))
      );
      const validFundResults = fundResults.filter(r => r !== null);
      finalResults = [...finalResults, ...validFundResults];
    }

    return NextResponse.json(finalResults);
  } catch (error: any) {
    console.error('API Final Error:', error.message);
    return NextResponse.json({ error: 'Veri işleme hatası.' }, { status: 500 });
  }
}
