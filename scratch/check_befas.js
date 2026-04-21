import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhthamfrgstvmxbprvze.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odGhhbWZyZ3N0dm14YnBydnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5MTgsImV4cCI6MjA5MTkzNjkxOH0.vR7GLrTGyM-x4IICaTJegYbuigcDi9fTXxlHVWplj8o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBefas() {
  console.log('--- BEFAS Assets in "assets" table ---')
  const { data: assets, error: err1 } = await supabase
    .from('assets')
    .select('symbol, type')
    .eq('type', 'BEFAS')
  
  if (err1) console.error(err1)
  else console.log(assets)

  console.log('\n--- BEFAS entries in "asset_prices" table ---')
  if (assets && assets.length > 0) {
    const symbols = assets.map(a => a.symbol)
    const { data: prices, error: err2 } = await supabase
      .from('asset_prices')
      .select('*')
      .in('symbol', symbols)
    
    if (err2) console.error(err2)
    else console.log(prices)
  } else {
    // If none found in assets, check if any exist at all in asset_prices with source 'borsapy' or similar
    const { data: allBefas, error: err3 } = await supabase
        .from('asset_prices')
        .select('*')
        .limit(10)
    
    console.log('No BEFAS assets found in "assets" table, checking first 10 entries in "asset_prices":')
    console.log(allBefas)
  }
}

checkBefas()
