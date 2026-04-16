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
      
      // Market durumu kontrolü
      const isMarketOpen = quote.marketState === 'REGULAR';

      try {
        const period1 = new Date();
        period1.setDate(period1.getDate() - 3);
        const chart = await yf.chart(quote.symbol, { interval: '1h', period1 }).catch(() => null);
        
        if (chart && chart.quotes) {
          const valid = chart.quotes.filter((q: any) => q.close !== null && q.close !== undefined);
          
          if (valid.length > 0) {
            if (isBIST) {
              // BIST için TV standart mumları: 14:00 (11:00 UTC) ve 18:00 (15:00 UTC)
              const tvBist = valid.filter((q: any) => {
                const hour = new Date(q.date).getUTCHours();
                return hour === 11 || hour === 15;
              });
              
              // Eğer piyasa kapalıysa direkt son fiyatı al, değilse en son TV mumunu al
              if (!isMarketOpen) {
                last4hPrice = quote.regularMarketPrice;
              } else {
                last4hPrice = tvBist.length > 0 ? tvBist[tvBist.length - 1].close : valid[valid.length - 1].close;
              }
            } else {
              // Kripto ve US için standart 4h dilimleri (0, 4, 8, 12, 16, 20 UTC)
              const tvOthers = valid.filter((q: any) => (new Date(q.date).getUTCHours() % 4 === 0));
              last4hPrice = tvOthers.length > 0 ? tvOthers[tvOthers.length - 1].close : valid[valid.length - 1].close;
            }
          }
        }
      } catch (e) {
        console.error('Chart error for', quote.symbol, e);
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        last4hPrice: last4hPrice, // Artık BIST kapalıyken price ile aynı olacak
        name: quote.shortName || quote.longName,
        changePercent: quote.regularMarketChangePercent
      };
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Global API error:', error);
    return NextResponse.json({ error: 'Data Fetching Error' }, { status: 500 });
  }
}
