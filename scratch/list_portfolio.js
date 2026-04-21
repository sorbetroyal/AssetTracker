import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhthamfrgstvmxbprvze.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odGhhbWZyZ3N0dm14YnBydnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5MTgsImV4cCI6MjA5MTkzNjkxOH0.vR7GLrTGyM-x4IICaTJegYbuigcDi9fTXxlHVWplj8o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listPortfolio() {
  const { data, error } = await supabase
    .from('portfolio')
    .select('symbol, asset_type, currency')
  
  if (error) console.error(error)
  else {
      data.forEach(d => console.log(`${d.symbol}: ${d.asset_type} [${d.currency}]`));
  }
}

listPortfolio()
