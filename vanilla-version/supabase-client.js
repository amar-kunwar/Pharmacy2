// ─── Supabase Client ────────────────────────────────
const SUPABASE_URL  = 'https://kaxvhryzkvjnkfbfdtqc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheHZocnl6a3ZqbmtmYmZkdHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzQ3NzcsImV4cCI6MjA5Mjk1MDc3N30.FU0eY5S0vVPvmfupa24PfTeFkjrop2iAe4qsWimUB4Y';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
