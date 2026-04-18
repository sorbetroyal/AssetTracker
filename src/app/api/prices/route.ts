import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

/**
 * Bekleme fonksiyonu (Retry için)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// SENIN OZEL GOOGLE PROXY URL'IN
const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbxHnFmv5fAJA1s-nGwsT8jiNkCDpwQQc5UB0fElp4X50sMcqXsBPrHXRkFdmUBXGy54g/exec';

/**
 * Google Apps Script Proxy üzerinden veriyi çeker.
 * Bu sayede Vercel'in engellenen IP'leri asilir.
 */
async function fetchTefasViaProxy(symbol: string, type: string, retries = 3) {
  const body = new URLSearchParams();
  body.append('dil', 'TR');
  body.append('fonkod', symbol);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(GAS_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000) // Google bazen yavas olabilir
      });

      if (!response.ok) {
        throw new Error(`Proxy HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Google Bridge bazen JSON icinde error donebilir
      if (data.error) {
        throw new Error(`Proxy Internal Error: ${data.error}`);
      }

      // Veri kontrolü
      if (!data || !data.fundInfo || data.fundInfo.length === 0) {
        throw new Error('EMPTY_DATA_FROM_PROXY');
      }

      const info = data.fundInfo[0];
      return {
        symbol: symbol,
        type: type,
        price: parseFloat(info.SONFIYAT || '0'),
        name: info.FONUNVAN,
        changePercent: parseFloat(info.GUNLUKGETIRI || '0'),
        source: 'google-proxy'
      };

    } catch (error: any) {
      console.warn(`[Proxy Attempt ${i + 1}] failed for ${symbol}: ${error.message}`);
      if (i < retries - 1) {
        await delay(1000); 
      }
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairsParam = searchParams.get('pairs');
  if (!pairsParam) return NextResponse.json({ error: 'No pairs provided' }, { status: 400 });

  const pairs = pairsParam.split(',');
  
  const fundPairs = pairs.filter(p => p.startsWith('TEFAS:') || p.startsWith('BEFAS:'));
  const fundSymbolsWithTypes = fundPairs.map(p => {
    const [type, symbol] = p.split(':');
    return { type, symbol };
  });

  const otherPairs = pairs.filter(p => !p.startsWith('TEFAS:') && !p.startsWith('BEFAS:'));
  const otherSymbols = otherPairs.map(p => p.split(':')[1]);
  const otherTypes = otherPairs.reduce((acc: any, p) => {
    const [type, sym] = p.split(':');
    acc[sym] = type;
    return acc;
  }, {});

  try {
    let finalResults: any[] = [];

    // 1. Yahoo Finance
    if (otherSymbols.length > 0) {
      try {
        const quotes = await yf.quote(otherSymbols);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        
        const yahooResults = quotesArray.map(quote => {
          const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.regularMarketPreviousClose ?? 0;
          return {
            symbol: quote.symbol,
            type: otherTypes[quote.symbol],
            price: price,
            name: quote.shortName || quote.longName,
            changePercent: quote.regularMarketChangePercent ?? 0,
            source: 'yahoo'
          };
        });
        finalResults = [...finalResults, ...yahooResults];
      } catch (error) {
        console.error('Yahoo Finance error:', error);
      }
    }

    // 2. Google Proxy üzerinden TEFAS/BEFAS
    if (fundSymbolsWithTypes.length > 0) {
      const fundResults = await Promise.all(
        fundSymbolsWithTypes.map(item => fetchTefasViaProxy(item.symbol, item.type))
      );
      const validFundResults = fundResults.filter(r => r !== null);
      finalResults = [...finalResults, ...validFundResults];
    }

    return NextResponse.json(finalResults);
  } catch (error: any) {
    console.error('Final API Error:', error.message);
    return NextResponse.json({ error: 'Veri işleme sırasında hata oluştu.' }, { status: 500 });
  }
}
