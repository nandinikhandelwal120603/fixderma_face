-- Phase 2: User Persistence & History

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  age int,
  created_at timestamp with time zone default now()
);

-- 2. Scans History Table
create table if not exists scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  conditions jsonb not null,
  products jsonb not null,
  skin_type text,
  image_url text, -- optional if we want to store bucket links later
  created_at timestamp with time zone default now()
);

-- 3. Raw AI Logs (For fine-tuning and debugging)
create table if not exists raw_ai_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- nullable for guest scans
  raw_response text not null,
  cleaned_response jsonb,
  model_name text default 'gemini-2.5-flash',
  created_at timestamp with time zone default now()
);

-- Indexing for performance
create index if not exists idx_scans_user_id on scans(user_id);
create index if not exists idx_users_created_at on users(created_at desc);
