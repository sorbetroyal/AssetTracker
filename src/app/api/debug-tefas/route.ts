import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'GMC';
  
  const results: any = {
    test_time: new Date().toISOString(),
    searched_symbol: symbol,
  };

  try {
    // 1. asset_prices tablosunu doğrudan sorgula
    const { data: dbData, error: dbError } = await supabase
      .from('asset_prices')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    results.direct_supabase_query = { data: dbData, error: dbError };

    // 2. Mevcut API mantığını (fetchFundsFromSupabase benzeri) test et
    const { data: listData, error: listError } = await supabase
      .from('asset_prices')
      .select('*')
      .in('symbol', [symbol.toUpperCase()]);
      
    results.api_logic_test = { data: listData, error: listError };

    // 3. Sembol listesi testi
    const { data: allData } = await supabase.from('asset_prices').select('symbol');
    results.all_cached_symbols = allData?.map(d => d.symbol);

  } catch (err: any) {
    results.critical_error = err.message;
  }

  return NextResponse.json(results);
}
