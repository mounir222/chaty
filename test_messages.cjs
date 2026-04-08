const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  let url = '', key = '';
  for(const line of env.split('\n')) {
    if(line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
  }
  const supabase = createClient(url, key);
  
  // Realtime equivalent
  const { data: messages, error } = await supabase.from('messages')
        .select('*, profiles:user_profiles(*)')
        .limit(1);
        
  if (error) console.error(error);
  console.log(JSON.stringify(messages, null, 2));
}

check();
