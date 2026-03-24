-- ============================================================
-- GCT Hostel Link — Full Supabase Schema (Production Ready)
-- Developer: Ameer Hamza Arshad
-- Institution: GCT TEVTA Hostel, Taxila
-- Version: 2.0 — Bank-Level Financial Safety
-- ============================================================
-- HOW TO RUN:
--   Paste the ENTIRE contents of this file into
--   Supabase Dashboard → SQL Editor → New Query → Run
--   It is safe to run multiple times (uses IF NOT EXISTS + OR REPLACE)
-- ============================================================


-- ===================
-- PROFILES TABLE
-- ===================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'mess_owner', 'student')),
  status text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  email text not null,
  name text not null,
  secret_key text,
  roll_number text unique,
  father_name text,
  technology text,
  room_no text,
  shift text check (shift in ('1st', '2nd')),
  hostel text check (hostel in ('Jinnah', 'Iqbal')),
  phone text,
  father_phone text,
  address text,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- RLS on profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Teachers and mess_owners can view student profiles" on public.profiles;
create policy "Teachers and mess_owners can view student profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'mess_owner'))
    and role = 'student'
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Anyone can insert own profile on signup" on public.profiles;
create policy "Anyone can insert own profile on signup" on public.profiles
  for insert with check (auth.uid() = id);


-- ===================
-- DELETED PROFILES (Trash)
-- ===================
create table if not exists public.deleted_profiles (
  id uuid primary key,
  role text,
  status text,
  email text,
  name text,
  secret_key text,
  roll_number text,
  father_name text,
  technology text,
  room_no text,
  shift text,
  hostel text,
  phone text,
  father_phone text,
  address text,
  profile_photo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz not null default now(),
  deleted_by uuid
);

alter table public.deleted_profiles enable row level security;

drop policy if exists "Admins manage deleted_profiles" on public.deleted_profiles;
create policy "Admins manage deleted_profiles" on public.deleted_profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===================
-- ATTENDANCE TABLE
-- ===================
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'leave')),
  is_locked boolean not null default false,
  marked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, date)
);

drop trigger if exists attendance_updated_at on public.attendance;
create trigger attendance_updated_at
  before update on public.attendance
  for each row execute procedure public.set_updated_at();

alter table public.attendance enable row level security;

drop policy if exists "Students can view own attendance" on public.attendance;
create policy "Students can view own attendance" on public.attendance
  for select using (auth.uid() = student_id);

drop policy if exists "Staff can view all attendance" on public.attendance;
create policy "Staff can view all attendance" on public.attendance
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

drop policy if exists "Teachers can insert attendance" on public.attendance;
create policy "Teachers can insert attendance" on public.attendance
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

drop policy if exists "Teachers can update unlocked attendance" on public.attendance;
create policy "Teachers can update unlocked attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
    and is_locked = false
  );

drop policy if exists "Admins can update any attendance" on public.attendance;
create policy "Admins can update any attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===================
-- MESS FEES TABLE
-- ⚠️  IMPORTANT: ON DELETE RESTRICT — deleting a student is BLOCKED
--     if they have fee records. Archive the student instead.
-- ===================
create table if not exists public.mess_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at timestamptz,
  set_by uuid references public.profiles(id) on delete set null,
  marked_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, month)
);

drop trigger if exists mess_fees_updated_at on public.mess_fees;
create trigger mess_fees_updated_at
  before update on public.mess_fees
  for each row execute procedure public.set_updated_at();

-- Enforce: paid_at must be set when status = 'paid'
create or replace function public.validate_mess_fee_payment()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at = now();
  end if;
  if new.status = 'unpaid' then
    new.paid_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists mess_fees_payment_check on public.mess_fees;
create trigger mess_fees_payment_check
  before insert or update on public.mess_fees
  for each row execute procedure public.validate_mess_fee_payment();

alter table public.mess_fees enable row level security;

drop policy if exists "Students can view own mess fees" on public.mess_fees;
create policy "Students can view own mess fees" on public.mess_fees
  for select using (auth.uid() = student_id);

drop policy if exists "Staff can view all mess fees" on public.mess_fees;
create policy "Staff can view all mess fees" on public.mess_fees
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin', 'mess_owner'))
  );

drop policy if exists "Mess owners can manage mess fees" on public.mess_fees;
create policy "Mess owners can manage mess fees" on public.mess_fees
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mess_owner')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mess_owner')
  );

drop policy if exists "Admins can manage mess fees" on public.mess_fees;
create policy "Admins can manage mess fees" on public.mess_fees
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===================
-- ELECTRICITY BILLS TABLE
-- ⚠️  IMPORTANT: ON DELETE RESTRICT — same protection as mess_fees
-- ===================
create table if not exists public.electricity_bills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at timestamptz,
  set_by uuid references public.profiles(id) on delete set null,
  marked_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, month)
);

drop trigger if exists electricity_bills_updated_at on public.electricity_bills;
create trigger electricity_bills_updated_at
  before update on public.electricity_bills
  for each row execute procedure public.set_updated_at();

-- Enforce paid_at consistency
create or replace function public.validate_electricity_payment()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at = now();
  end if;
  if new.status = 'unpaid' then
    new.paid_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists electricity_bills_payment_check on public.electricity_bills;
create trigger electricity_bills_payment_check
  before insert or update on public.electricity_bills
  for each row execute procedure public.validate_electricity_payment();

alter table public.electricity_bills enable row level security;

drop policy if exists "Students can view own electricity bills" on public.electricity_bills;
create policy "Students can view own electricity bills" on public.electricity_bills
  for select using (auth.uid() = student_id);

drop policy if exists "Staff can view all electricity bills" on public.electricity_bills;
create policy "Staff can view all electricity bills" on public.electricity_bills
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin', 'mess_owner'))
  );

drop policy if exists "Teachers and admins can manage electricity bills" on public.electricity_bills;
create policy "Teachers and admins can manage electricity bills" on public.electricity_bills
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );


-- ===================
-- COMPLAINTS TABLE
-- ===================
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'fixed', 'cancelled')),
  reply text,
  replied_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists complaints_updated_at on public.complaints;
create trigger complaints_updated_at
  before update on public.complaints
  for each row execute procedure public.set_updated_at();

alter table public.complaints enable row level security;

drop policy if exists "Students can view all complaints" on public.complaints;
create policy "Students can view all complaints" on public.complaints
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

drop policy if exists "Staff can view all complaints with author" on public.complaints;
create policy "Staff can view all complaints with author" on public.complaints
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

drop policy if exists "Students can insert own complaints" on public.complaints;
create policy "Students can insert own complaints" on public.complaints
  for insert with check (
    auth.uid() = student_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

drop policy if exists "Staff can update complaints" on public.complaints;
create policy "Staff can update complaints" on public.complaints
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

drop policy if exists "Admins can delete complaints" on public.complaints;
create policy "Admins can delete complaints" on public.complaints
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===================
-- DELETED COMPLAINTS (Trash)
-- ===================
create table if not exists public.deleted_complaints (
  id uuid primary key,
  student_id uuid,
  category text,
  subject text,
  description text,
  status text,
  reply text,
  replied_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz not null default now(),
  deleted_by uuid
);

alter table public.deleted_complaints enable row level security;

drop policy if exists "Admins manage deleted_complaints" on public.deleted_complaints;
create policy "Admins manage deleted_complaints" on public.deleted_complaints
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===================
-- AUDIT LOGS TABLE
-- Immutable — no update/delete policies intentionally
-- ===================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_by uuid references public.profiles(id) on delete set null,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Staff can insert audit logs" on public.audit_logs;
create policy "Staff can insert audit logs" on public.audit_logs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher', 'mess_owner'))
  );
-- NOTE: No UPDATE or DELETE policy — audit logs are append-only and immutable


-- ===================
-- ADMISSION SETTINGS TABLE
-- ===================
create table if not exists public.admission_settings (
  id uuid primary key default gen_random_uuid(),
  is_open boolean not null default false,
  apply_link text,
  message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.admission_settings enable row level security;

drop policy if exists "Anyone can view admission settings" on public.admission_settings;
create policy "Anyone can view admission settings" on public.admission_settings
  for select using (true);

drop policy if exists "Admins can manage admission settings" on public.admission_settings;
create policy "Admins can manage admission settings" on public.admission_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Insert default row if not present
insert into public.admission_settings (is_open, apply_link, message)
values (false, '', 'Admissions are currently closed. Check back soon for updates.')
on conflict do nothing;


-- ===================
-- STORAGE BUCKET — Run this manually in Supabase Dashboard
-- ===================
-- Dashboard → Storage → New Bucket
--   Name:       profile-photos
--   Public:     true
--   Max size:   3145728  (3 MB)
--   MIME types: image/*
--
-- Then add this Storage Policy (Dashboard → Storage → Policies):
--   INSERT: authenticated users can upload to their own folder
--   SELECT: public read


-- ===================
-- PERFORMANCE INDEXES
-- ===================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_profiles_roll_number on public.profiles(roll_number);

create index if not exists idx_attendance_student_date on public.attendance(student_id, date);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_attendance_is_locked on public.attendance(is_locked);

create index if not exists idx_mess_fees_student_month on public.mess_fees(student_id, month);
create index if not exists idx_mess_fees_month on public.mess_fees(month);
create index if not exists idx_mess_fees_status on public.mess_fees(status);
create index if not exists idx_mess_fees_month_status on public.mess_fees(month, status);

create index if not exists idx_electricity_student_month on public.electricity_bills(student_id, month);
create index if not exists idx_electricity_month on public.electricity_bills(month);
create index if not exists idx_electricity_status on public.electricity_bills(status);

create index if not exists idx_complaints_student on public.complaints(student_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created on public.complaints(created_at desc);

create index if not exists idx_audit_logs_table on public.audit_logs(table_name, created_at desc);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id, table_name);
create index if not exists idx_audit_logs_changed_by on public.audit_logs(changed_by);


-- ===================
-- GRANT PERMISSIONS
-- ===================
grant usage on schema public to anon, authenticated;

grant select on public.admission_settings to anon;

grant all on public.profiles to authenticated;
grant all on public.deleted_profiles to authenticated;
grant all on public.attendance to authenticated;
grant all on public.mess_fees to authenticated;
grant all on public.electricity_bills to authenticated;
grant all on public.complaints to authenticated;
grant all on public.deleted_complaints to authenticated;
grant all on public.audit_logs to authenticated;
grant all on public.admission_settings to authenticated;


-- ===================
-- FIRST ADMIN SETUP (run once manually after signup)
-- ===================
-- After the admin signs up via /signup page with role=admin,
-- run this to activate their account:
--
-- update public.profiles
-- set status = 'active', role = 'admin', secret_key = 'ADMIN-001'
-- where email = 'your-admin-email@example.com';
--
-- ============================================================
-- SETUP CHECKLIST (do these in Supabase Dashboard):
-- ============================================================
-- [1] Run this entire SQL file in SQL Editor
-- [2] Go to Auth → Settings → disable "Confirm email"
-- [3] Go to Storage → create bucket "profile-photos" (public, 3MB, image/*)
-- [4] Sign up with your admin email via /signup
-- [5] Run the "First Admin Setup" query above with your email
-- [6] Login as admin and start using the system
-- ============================================================
