
const https = require('https');

async function testTefasMagic() {
  const symbol = 'AE1';
  const targetUrl = 'https://www.tefas.gov.tr/api/DB/GetAllFundAnalyzeData';
  const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
  
  // Use https agent to bypass SSL issues if needed
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const body = new URLSearchParams();
  body.append('dil', 'TR');
  body.append('fonkod', symbol);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.tefas.gov.tr',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body.toString()
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('RAW RAW RAW TEXT (First 200 chars):', text.substring(0, 200));
    
    try {
      const data = JSON.parse(text);
      const info = data.fundInfo[0];
      console.log('Parsed - SONFIYAT:', info.SONFIYAT);
      console.log('Parsed - GUNLUKGETIRI:', info.GUNLUKGETIRI);
    } catch (e) {
      console.log('Response is not JSON or fundInfo missing');
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testTefasMagic();
