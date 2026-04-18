import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

/**
 * Bekleme fonksiyonu (Retry için)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * TEFAS/BEFAS Veri Çekici (Retry destekli)
 * borsa-mcp'den alınan retry ve WAF bypass mantığı entegre edildi.
 */
async function fetchTefasWithRetry(symbol: string, type: string, retries = 3) {
  const url = 'https://www.tefas.gov.tr/api/DB/GetAllFundAnalyzeData';
  const body = new URLSearchParams();
  body.append('dil', 'TR');
  body.append('fonkod', symbol);

  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://www.tefas.gov.tr',
    'Pragma': 'no-cache',
    'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body.toString(),
        // Vercel'de timeout riskine karşı fetch'i hızlı tutuyoruz
        signal: AbortSignal.timeout(8000) 
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('WAF_BLOCK_DETECTED');
      }

      const data = await response.json();
      if (!data || !data.fundInfo || data.fundInfo.length === 0) {
        throw new Error('EMPTY_DATA');
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
      console.warn(`Attempt ${i + 1} failed for ${symbol}: ${error.message}`);
      if (i < retries - 1) {
        // Artan sürelerle bekle: 0.5s, 1s, 2s
        await delay(500 * Math.pow(2, i)); 
      } else {
        console.error(`All ${retries} attempts failed for ${symbol}`);
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

    // 2. TEFAS/BEFAS (Retry Mekanizmalı)
    if (fundSymbolsWithTypes.length > 0) {
      // Paralel fetch ama her biri kendi içinde retry yapıyor
      const fundResults = await Promise.all(
        fundSymbolsWithTypes.map(item => fetchTefasWithRetry(item.symbol, item.type))
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
