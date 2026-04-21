import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhthamfrgstvmxbprvze.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odGhhbWZyZ3N0dm14YnBydnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5MTgsImV4cCI6MjA5MTkzNjkxOH0.vR7GLrTGyM-x4IICaTJegYbuigcDi9fTXxlHVWplj8o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllAssets() {
  const { data: assets, error } = await supabase
    .from('assets')
    .select('symbol, type, name')
  
  if (error) console.error(error)
  else console.log(assets)
}

listAllAssets()
