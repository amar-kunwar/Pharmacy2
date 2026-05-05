-- Create settings table
create table if not exists settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) unique,
  bill_counter integer default 1000,
  estimate_counter integer default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create estimates table
create table if not exists estimates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  estimate_no text not null,
  sr_no text,
  date date not null,
  customer text not null,
  phone text,
  subtotal numeric,
  discount numeric,
  grand numeric,
  items jsonb,
  saved_at timestamptz default now()
);

-- Create bills table
create table if not exists bills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  bill_no text not null,
  sr_no text,
  date date not null,
  customer text not null,
  phone text,
  subtotal numeric,
  discount numeric,
  grand numeric,
  items jsonb,
  saved_at timestamptz default now()
);
