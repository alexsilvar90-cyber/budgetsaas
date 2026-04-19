-- =============================================
-- Budget SaaS — Supabase Schema
-- Run these statements in Supabase SQL editor
-- =============================================

-- 1. Cost Centers
create table if not exists cost_centers (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null
);

-- 2. Profiles (extends auth.users)
create table if not exists profiles (
  id              uuid primary key references auth.users on delete cascade,
  full_name       text,
  email           text,
  role            text check (role in ('admin','manager')) default 'manager',
  cost_center_id  uuid references cost_centers(id),
  is_active       boolean default true,
  last_sign_in_at timestamptz
);

-- Auto-create profile on first sign-in
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        last_sign_in_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Budget / Actual entries
create table if not exists budget_entries (
  id              uuid primary key default gen_random_uuid(),
  cost_center_id  uuid references cost_centers(id) not null,
  type            text check (type in ('budget','actual')) not null,
  year            int not null,
  month           int check (month between 1 and 12),
  description     text not null,
  category        text not null,
  amount          numeric(15,2) not null default 0,
  created_at      timestamptz default now()
);

-- 4. Upload history
create table if not exists upload_logs (
  id              uuid primary key default gen_random_uuid(),
  uploaded_by     uuid references profiles(id),
  cost_center_id  uuid references cost_centers(id),
  type            text,
  period          text,
  filename        text,
  storage_path    text,
  status          text check (status in ('ok','review','error')) default 'ok',
  error_message   text,
  row_count       int default 0,
  created_at      timestamptz default now()
);

-- 5. Row Level Security
alter table cost_centers   enable row level security;
alter table profiles        enable row level security;
alter table budget_entries  enable row level security;
alter table upload_logs     enable row level security;

-- Admins see everything; managers see only their cost center
create policy "profiles_select" on profiles
  for select using (auth.uid() = id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "budget_entries_select" on budget_entries
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.cost_center_id = budget_entries.cost_center_id)
    )
  );

create policy "budget_entries_insert" on budget_entries
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "upload_logs_all" on upload_logs
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "cost_centers_select" on cost_centers for select using (true);
