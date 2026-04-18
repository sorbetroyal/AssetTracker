
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

async function test() {
  try {
    const symbol = 'QQQ';
    const quote = await yf.quote(symbol);
    console.log('--- DATA FOR QQQ ---');
    console.log('Symbol:', quote.symbol);
    console.log('Regular Market Price:', quote.regularMarketPrice);
    console.log('Previous Close:', quote.regularMarketPreviousClose);
    console.log('Market Change Percent:', quote.regularMarketChangePercent);
  } catch (err) {
    console.error('Error fetching QQQ:', err);
  }
}

test();
