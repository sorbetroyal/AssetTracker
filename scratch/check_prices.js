const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

async function test() {
  const symbol = 'BTC-USD';
  try {
    const period1 = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000); // 2 days ago
    const chart = await yf.chart(symbol, { interval: '1h', period1 });
    
    console.log('--- Last 5 Quotes ---');
    chart.quotes.slice(-5).forEach((q, i) => {
      console.log(`Index ${i}: Price: ${q.close}, Time: ${new Date(q.date).toLocaleString()}`);
    });
    
    const quote = await yf.quote(symbol);
    console.log(`Current Quote Price: ${quote.regularMarketPrice}`);
  } catch (e) {
    console.error(e);
  }
}

test();
