const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function checkTypes() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  console.log('--- Portfolio Table Types ---');
  const { data: pData } = await supabase.from('portfolio').select('symbol, asset_type');
  console.table(pData);

  console.log('--- Assets Table Types ---');
  const { data: aData } = await supabase.from('assets').select('symbol, type');
  console.table(aData);
}

checkTypes();
