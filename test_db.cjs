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
  
  // Try to find a user
  const { data: profiles, error: err1 } = await supabase.from('user_profiles').select('*').limit(1);
  if (err1) {
     console.error("Fetch err:", err1);
     return;
  }
  if (profiles.length === 0) {
     console.log("No profiles found.");
     return;
  }
  const user = profiles[0];
  console.log("Found user:", user.username, user.id);
  
  // Try to update font_color
  const { data: updated, error: err2 } = await supabase.from('user_profiles')
    .update({ font_color: '#ff0000', font_size: 'large', font_weight: 'bold' })
    .eq('id', user.id)
    .select();
    
  if (err2) {
    console.error("Update err:", err2);
  } else {
    console.log("Updated successfully:", updated);
  }
}

check();
