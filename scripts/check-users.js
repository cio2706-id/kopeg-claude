const { config } = require('dotenv');
const path = require('path');
config({ path: path.resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get auth users
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 100 });
  console.log('=== SUPABASE AUTH USERS (' + authData.users.length + ') ===');
  authData.users.forEach(u => console.log(u.id.substring(0,8) + '... | ' + u.email));

  // Get DB users
  const { data: dbUsers } = await supabase.from('users').select('id, auth_id, email, full_name, role, employee_id');
  console.log('\n=== DB USERS TABLE (' + (dbUsers ? dbUsers.length : 0) + ') ===');
  if (dbUsers) {
    dbUsers.forEach(u => console.log((u.auth_id ? u.auth_id.substring(0,8) : 'no-auth') + '... | ' + u.email + ' | role=' + u.role + ' | name=' + u.full_name + ' | emp=' + u.employee_id));
  }

  // Find auth users NOT in DB
  const dbEmails = new Set((dbUsers || []).map(u => u.email));
  const dbAuthIds = new Set((dbUsers || []).map(u => u.auth_id));
  const notInDb = authData.users.filter(u => !dbAuthIds.has(u.id) && !dbEmails.has(u.email));
  console.log('\n=== AUTH USERS NOT YET IN DB (' + notInDb.length + ') ===');
  notInDb.forEach(u => console.log(u.email));

  const inDbByEmail = authData.users.filter(u => !dbAuthIds.has(u.id) && dbEmails.has(u.email));
  console.log('\n=== AUTH USERS IN DB BY EMAIL BUT NOT LINKED (' + inDbByEmail.length + ') ===');
  inDbByEmail.forEach(u => console.log(u.email + ' (will auto-link on first login)'));
}
check().catch(console.error);
