import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import YahooFinance from 'yahoo-finance2';

const yf = YahooFinance;

async function fetchFundsFromSupabase(symbols: string[]): Promise<any[]> {
  try {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    console.log('[Supabase Cache] Sorgulanan:', upperSymbols);
    
    const { data, error } = await supabase
      .from('asset_prices')
      .select('*')
      .in('symbol', upperSymbols);

    if (error) {
      console.error('[Supabase Cache] DB Hatasi:', error);
      return [];
    }
    
    return (data || []).map((item) => ({
      symbol: item.symbol,
      price: item.price,
      name: item.symbol,
      changePercent: item.daily_change,
      source: 'supabase_cache',
      updatedAt: item.updated_at,
    }));
  } catch (err: any) {
    console.error('[Supabase Cache] Kritik Hata:', err.message);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairsParam = searchParams.get('pairs');
  
  if (!pairsParam) {
    return NextResponse.json({ error: 'No pairs provided' }, { status: 400 });
  }

  const pairs = pairsParam.split(',');
  console.log('[Prices API] Gelen İstek:', pairs);

  const finalResults: any[] = [];
  const allSymbols = pairs.map(p => p.includes(':') ? p.split(':')[1] : p);
  const typeBySymbol: Record<string, string> = {};
  
  pairs.forEach(p => {
    const [type, sym] = p.includes(':') ? p.split(':') : ['BIST', p];
    typeBySymbol[sym.toUpperCase()] = type;
  });

  try {
    // 1. ÖNCE SUPABASE'DE ARA (Tüm semboller için)
    const supabaseResults = await fetchFundsFromSupabase(allSymbols);
    const foundInSupabase = new Set(supabaseResults.map(r => r.symbol.toUpperCase()));
    
    supabaseResults.forEach(r => {
      finalResults.push({
        ...r,
        type: typeBySymbol[r.symbol.toUpperCase()] || 'TEFAS'
      });
    });

    // 2. SUPABASE'DE OLMAYANLARI YAHOO'DAN ÇEK
    const missingSymbols = allSymbols.filter(s => !foundInSupabase.has(s.toUpperCase()));
    
    if (missingSymbols.length > 0) {
      console.log('[Yahoo Finance] Sorgulanan:', missingSymbols);
      try {
        // yahoo-finance2 batch quote desteği var
        const quotes = await yf.quote(missingSymbols);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        
        quotesArray.forEach((q) => {
          finalResults.push({
            symbol: q.symbol,
            price: q.regularMarketPrice || q.postMarketPrice || 0,
            name: q.shortName || q.symbol,
            changePercent: q.regularMarketChangePercent || 0,
            type: typeBySymbol[q.symbol.toUpperCase()] || 'BIST',
            source: 'yahoo'
          });
        });
      } catch (err) {
        console.error('[Yahoo Finance] Hata:', err);
      }
    }

    return NextResponse.json(finalResults);
  } catch (error: any) {
    console.error('[Prices API] Genel Hata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
