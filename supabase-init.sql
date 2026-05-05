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

-- Enable RLS on settings table
alter table settings enable row level security;

-- Create RLS policies for settings table
create policy "Users can view their own settings" on settings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own settings" on settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings" on settings
  for update using (auth.uid() = user_id);

-- Enable RLS on estimates table
alter table estimates enable row level security;

-- Create RLS policies for estimates table
create policy "Users can view their own estimates" on estimates
  for select using (auth.uid() = user_id);

create policy "Users can insert their own estimates" on estimates
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own estimates" on estimates
  for update using (auth.uid() = user_id);

create policy "Users can delete their own estimates" on estimates
  for delete using (auth.uid() = user_id);

-- Enable RLS on bills table
alter table bills enable row level security;

-- Create RLS policies for bills table
create policy "Users can view their own bills" on bills
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bills" on bills
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bills" on bills
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bills" on bills
  for delete using (auth.uid() = user_id);
