const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

async function test() {
  try {
    const result = await yf.quote('AAPL');
    console.log('AAPL Price:', result.regularMarketPrice);
    process.exit(0);
  } catch (e) {
    console.error('Error Details:', e);
    process.exit(1);
  }
}

test();
