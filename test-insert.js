import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kaxvhryzkvjnkfbfdtqc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheHZocnl6a3ZqbmtmYmZkdHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzQ3NzcsImV4cCI6MjA5Mjk1MDc3N30.FU0eY5S0vVPvmfupa24PfTeFkjrop2iAe4qsWimUB4Y';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function test() {
  const payloads = [
    {
      date: '2026-05',
      medicine_name: 'Med 1',
      user_id: 'a5c0b771-3310-410a-b8ec-f5df3df1cbff'
    },
    {
      id: 'd9620027-18b3-46de-a6b1-afaa437cefc5',
      date: '2026-05',
      medicine_name: 'Med 2',
      user_id: 'a5c0b771-3310-410a-b8ec-f5df3df1cbff'
    }
  ];
  
  const { data, error } = await supabase.from('expiries').upsert(payloads).select();
  console.log("Error inserting array with mixed keys:", error);
}

test();
