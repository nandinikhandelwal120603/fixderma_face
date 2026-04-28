-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USER & SCAN HISTORY (PHASE 2)
-- ==========================================

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  age int,
  created_at timestamp with time zone default now()
);

create table if not exists scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  conditions jsonb not null,
  products jsonb not null,
  skin_type text,
  image_url text,
  created_at timestamp with time zone default now()
);

create table if not exists raw_ai_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  raw_response text not null,
  cleaned_response jsonb,
  model_name text default 'gemini-2.5-flash',
  tokens_used integer,
  latency_ms integer,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. PRODUCT CATALOG (FOR CSV IMPORT)
-- ==========================================

create table if not exists product_catalog (
  id text primary key,
  name text not null,
  category text,
  concerns text[],
  ingredients text[],
  description text,
  price integer,
  image_url text,
  buy_link text,
  usage text
);

create table if not exists condition_product_map (
  id uuid primary key default uuid_generate_v4(),
  condition text not null,
  severity text,
  product_ids text[] 
);

-- Indexing for performance
create index if not exists idx_scans_user_id on scans(user_id);
create index if not exists idx_users_created_at on users(created_at desc);
create index if not exists idx_raw_ai_logs_user_id on raw_ai_logs(user_id);
