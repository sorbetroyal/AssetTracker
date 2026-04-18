/**
 * TEFAS/BEFAS fon fiyatı çekici - saf TypeScript implementasyonu.
 *
 * borsapy / tefas-crawler mantığını taklit eder:
 * 1. fundturkey.com.tr ana sayfasına GET → session cookie al
 * 2. /api/DB/BindHistoryInfo'ye POST → fon verisi çek
 *
 * NOT: fundturkey.com.tr eski SSL (legacy renegotiation) kullandığından
 * Node.js fetch() çalışmıyor. Node.js https modülü kullanılıyor.
 */

import https from 'https';

const ROOT_HOST = 'www.fundturkey.com.tr';

// SSL doğrulamasını devre dışı bırakan agent (fundturkey legacy SSL için)
const AGENT = new https.Agent({ rejectUnauthorized: false });

const BASE_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  Origin: `https://${ROOT_HOST}`,
  Referer: `https://${ROOT_HOST}/TarihselVeriler.aspx`,
};

/** Cookie'yi bir kez alıp cache'le */
let cachedCookie: string | null = null;

function httpsRequest(
  options: https.RequestOptions,
  body?: string
): Promise<{ status: number; headers: Record<string, string | string[]>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, agent: AGENT }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string | string[]>,
          body: data,
        })
      );
    });
    req.on('error', reject);
    req.setTimeout(12_000, () => {
      req.destroy(new Error('Request timeout'));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function getSessionCookie(): Promise<string> {
  if (cachedCookie) return cachedCookie;

  const res = await httpsRequest({
    hostname: ROOT_HOST,
    path: '/',
    method: 'GET',
    headers: { 'User-Agent': BASE_HEADERS['User-Agent'] },
  });

  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) {
    cachedCookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  } else if (setCookie) {
    cachedCookie = setCookie.split(';')[0];
  } else {
    cachedCookie = '';
  }

  return cachedCookie;
}

/** "DD.MM.YYYY" formatına çevirir */
function toTefasDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export interface TefasFundResult {
  symbol: string;
  price: number;
  changePercent: number;
  name: string;
  date: string;
  source: 'fundturkey';
}

/**
 * Belirli bir tarih için fon fiyatını döner.
 * Tarih verilmezse bugünün ya da son iş gününün fiyatı döner.
 */
export async function fetchTefasPrice(
  symbol: string,
  targetDate?: string
): Promise<TefasFundResult | null> {
  try {
    const cookie = await getSessionCookie();

    const endDate = targetDate ? new Date(targetDate) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 5);

    // Tüm fon tiplerini sırayla dene (YAT=yatırım, EMK=emeklilik/BEFAS, BYF=ETF)
    const FUND_TYPES = ['YAT', 'EMK', 'BYF'];
    let rows: any[] = [];

    for (const fontip of FUND_TYPES) {
      const bodyParams = new URLSearchParams({
        fontip,
        bastarih: toTefasDate(startDate),
        bittarih: toTefasDate(endDate),
        fonkod: symbol.toUpperCase(),
        sfonkod: '',
      });
      const bodyStr = bodyParams.toString();

      const res = await httpsRequest(
        {
          hostname: ROOT_HOST,
          path: '/api/DB/BindHistoryInfo',
          method: 'POST',
          headers: {
            ...BASE_HEADERS,
            Cookie: cookie,
            'Content-Length': Buffer.byteLength(bodyStr),
          },
        },
        bodyStr
      );

      if (res.status === 200) {
        const json = JSON.parse(res.body);
        rows = json?.data ?? [];
        if (rows.length > 0) break;
      }
    }


    if (rows.length === 0) return null;

    const sorted = rows.sort((a, b) => Number(b.TARIH) - Number(a.TARIH));
    const latest = sorted[0];

    const price = parseFloat(latest.FIYAT ?? '0');
    const dateMs = parseInt(latest.TARIH ?? '0', 10);
    const dateStr = new Date(dateMs).toISOString().split('T')[0];

    let changePercent = 0;
    if (sorted.length > 1) {
      const prev = parseFloat(sorted[1].FIYAT ?? '0');
      if (prev > 0) changePercent = ((price - prev) / prev) * 100;
    }

    return {
      symbol,
      price,
      changePercent: parseFloat(changePercent.toFixed(4)),
      name: latest.FONUNVAN ?? symbol,
      date: dateStr,
      source: 'fundturkey',
    };
  } catch (err: any) {
    console.error(`[TEFAS] ${symbol} fiyat hatası:`, err.message);
    return null;
  }
}

/**
 * Birden fazla fon sembolünü paralel olarak çeker.
 */
export async function fetchTefasPrices(
  symbols: string[]
): Promise<TefasFundResult[]> {
  await getSessionCookie();

  const results = await Promise.allSettled(
    symbols.map((s) => fetchTefasPrice(s))
  );

  return results
    .map((r, i) => {
      if (r.status === 'fulfilled' && r.value) return r.value;
      console.warn(`[TEFAS] ${symbols[i]} alınamadı`);
      return null;
    })
    .filter((r): r is TefasFundResult => r !== null);
}
