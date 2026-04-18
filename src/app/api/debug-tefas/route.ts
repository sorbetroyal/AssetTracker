import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const AGENT = new https.Agent({ rejectUnauthorized: false });

function httpsGet(host: string, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: host, path, method: 'GET', agent: AGENT,
        headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data.slice(0, 200) }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10_000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

function httpsPost(host: string, path: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: host, path, method: 'POST', agent: AGENT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data.slice(0, 500) }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10_000, () => req.destroy(new Error('timeout')));
    req.write(body);
    req.end();
  });
}

export async function GET(_req: NextRequest) {
  const results: Record<string, any> = {};

  // 1. fundturkey.com.tr ana sayfa GET
  try {
    const r = await httpsGet('www.fundturkey.com.tr', '/');
    results.step1_get_homepage = { status: r.status, preview: r.body };
  } catch (e: any) {
    results.step1_get_homepage = { error: e.message };
  }

  // 2. BindHistoryInfo POST
  try {
    const today = new Date();
    const past = new Date(); past.setDate(past.getDate() - 5);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
    const body = `fontip=YAT&bastarih=${fmt(past)}&bittarih=${fmt(today)}&fonkod=MAC&sfonkod=`;
    const r = await httpsPost('www.fundturkey.com.tr', '/api/DB/BindHistoryInfo', body);
    results.step2_post_info = { status: r.status, preview: r.body };
  } catch (e: any) {
    results.step2_post_info = { error: e.message };
  }

  return NextResponse.json(results);
}
