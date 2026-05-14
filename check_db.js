const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './client/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('recordings').select('id, phone_number, duration_seconds, status').order('created_at', { ascending: false }).limit(5);
  console.log(data);
}
check();
