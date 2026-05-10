import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kaxvhryzkvjnkfbfdtqc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheHZocnl6a3ZqbmtmYmZkdHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzQ3NzcsImV4cCI6MjA5Mjk1MDc3N30.FU0eY5S0vVPvmfupa24PfTeFkjrop2iAe4qsWimUB4Y';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function test() {
  const payload = {
    // We explicitly omit 'id' to simulate the missing property for new rows
    date: '2026-05',
    medicine_name: 'Test Med',
    pack: 'Tablets',
    qty: 0,
    expiry: '2026-05',
    batch: '',
    mrp: 0,
    distributor_id: null,
    // Provide a valid dummy UUID to pass UUID validation, but it will fail RLS if not real user
    user_id: 'a5c0b771-3310-410a-b8ec-f5df3df1cbff',
    saved_at: new Date().toISOString()
  };
  
  // Try inserting
  const { data, error } = await supabase.from('expiries').upsert([payload]).select();
  console.log("Error inserting:", error);
}

test();
