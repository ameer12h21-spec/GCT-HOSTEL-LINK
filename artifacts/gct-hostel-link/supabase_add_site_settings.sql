-- ============================================================
-- ADD: site_settings table
-- Run this if you already ran supabase_schema.sql or
-- supabase_complete_v3.sql and just need the new table.
-- Safe to run multiple times.
-- ============================================================

-- Helper function (safe to re-run)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Table
create table if not exists public.site_settings (
  id          uuid    primary key default gen_random_uuid(),
  settings    jsonb   not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid    references public.profiles(id) on delete set null
);

-- Trigger
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings" on public.site_settings
  for select using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Grants
grant select on public.site_settings to anon;
grant all on public.site_settings to authenticated;

-- Realtime (optional — needed for live theme sync across users)
-- alter publication supabase_realtime add table public.site_settings;

-- ============================================================
-- DONE. The admin can now access Site Design in their dashboard.
-- ============================================================
