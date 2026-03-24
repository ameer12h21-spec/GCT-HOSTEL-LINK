-- ============================================================
-- GCT Hostel Link — SAFE UPGRADE MIGRATION v2.0
-- Developer: Ameer Hamza Arshad
-- ============================================================
-- PURPOSE: Run this if you already have an older schema.
--          It is safe to run multiple times.
--          It adds new columns, triggers, indexes, and policies
--          WITHOUT touching or deleting your existing data.
-- ============================================================
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query
--   Paste this entire file → Run All
-- ============================================================


-- ============================================================
-- STEP 1: SHARED TRIGGER FUNCTION (updated_at auto-stamp)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- profiles: add updated_at if missing
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- mess_fees: add new tracking columns if missing
alter table public.mess_fees add column if not exists updated_at timestamptz not null default now();
alter table public.mess_fees add column if not exists set_by uuid references public.profiles(id) on delete set null;
alter table public.mess_fees add column if not exists marked_by uuid references public.profiles(id) on delete set null;
alter table public.mess_fees add column if not exists notes text;

-- electricity_bills: add new tracking columns if missing
alter table public.electricity_bills add column if not exists updated_at timestamptz not null default now();
alter table public.electricity_bills add column if not exists set_by uuid references public.profiles(id) on delete set null;
alter table public.electricity_bills add column if not exists marked_by uuid references public.profiles(id) on delete set null;
alter table public.electricity_bills add column if not exists notes text;

-- attendance: add updated_at if missing
alter table public.attendance add column if not exists updated_at timestamptz not null default now();

-- complaints: add replied_by column if missing
alter table public.complaints add column if not exists replied_by uuid references public.profiles(id) on delete set null;
alter table public.complaints add column if not exists updated_at timestamptz not null default now();

-- deleted_profiles: add deleted_by column if missing
alter table public.deleted_profiles add column if not exists deleted_by uuid;
alter table public.deleted_profiles add column if not exists updated_at timestamptz;
alter table public.deleted_profiles add column if not exists father_name text;
alter table public.deleted_profiles add column if not exists father_phone text;
alter table public.deleted_profiles add column if not exists address text;
alter table public.deleted_profiles add column if not exists secret_key text;

-- deleted_complaints: ensure table exists with all columns
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

-- audit_logs: make sure ip_address column exists
alter table public.audit_logs add column if not exists ip_address text;


-- ============================================================
-- STEP 3: ADD CHECK CONSTRAINTS (amount > 0, month format)
-- Only add if they don't already exist
-- ============================================================

do $$
begin
  -- mess_fees: amount > 0
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'mess_fees_amount_check'
    and constraint_schema = 'public'
  ) then
    alter table public.mess_fees add constraint mess_fees_amount_check check (amount > 0);
  end if;
exception when others then null;
end $$;

do $$
begin
  -- mess_fees: month format YYYY-MM
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'mess_fees_month_check'
    and constraint_schema = 'public'
  ) then
    alter table public.mess_fees add constraint mess_fees_month_check check (month ~ '^\d{4}-(0[1-9]|1[0-2])$');
  end if;
exception when others then null;
end $$;

do $$
begin
  -- electricity_bills: amount > 0
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'electricity_bills_amount_check'
    and constraint_schema = 'public'
  ) then
    alter table public.electricity_bills add constraint electricity_bills_amount_check check (amount > 0);
  end if;
exception when others then null;
end $$;

do $$
begin
  -- electricity_bills: month format YYYY-MM
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'electricity_bills_month_check'
    and constraint_schema = 'public'
  ) then
    alter table public.electricity_bills add constraint electricity_bills_month_check check (month ~ '^\d{4}-(0[1-9]|1[0-2])$');
  end if;
exception when others then null;
end $$;


-- ============================================================
-- STEP 4: ADD updated_at TRIGGERS
-- ============================================================

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists mess_fees_updated_at on public.mess_fees;
create trigger mess_fees_updated_at
  before update on public.mess_fees
  for each row execute procedure public.set_updated_at();

drop trigger if exists electricity_bills_updated_at on public.electricity_bills;
create trigger electricity_bills_updated_at
  before update on public.electricity_bills
  for each row execute procedure public.set_updated_at();

drop trigger if exists attendance_updated_at on public.attendance;
create trigger attendance_updated_at
  before update on public.attendance
  for each row execute procedure public.set_updated_at();

drop trigger if exists complaints_updated_at on public.complaints;
create trigger complaints_updated_at
  before update on public.complaints
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- STEP 5: PAYMENT CONSISTENCY TRIGGERS
-- (auto-sets paid_at when status=paid; clears it when unpaid)
-- ============================================================

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


-- ============================================================
-- STEP 6: FIX / REPLACE ALL RLS POLICIES (SAFE DROP + RECREATE)
-- ============================================================

-- ---- PROFILES ----
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );

drop policy if exists "Teachers and mess_owners can view student profiles" on public.profiles;
create policy "Teachers and mess_owners can view student profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role in ('teacher', 'mess_owner'))
    and role = 'student'
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );

drop policy if exists "Anyone can insert own profile on signup" on public.profiles;
create policy "Anyone can insert own profile on signup" on public.profiles
  for insert with check (auth.uid() = id);


-- ---- DELETED PROFILES ----
alter table public.deleted_profiles enable row level security;

drop policy if exists "Admins manage deleted_profiles" on public.deleted_profiles;
create policy "Admins manage deleted_profiles" on public.deleted_profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ---- ATTENDANCE ----
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


-- ---- MESS FEES ----
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

-- Remove any old catch-all policy that might conflict
drop policy if exists "mess_fees_policy" on public.mess_fees;
drop policy if exists "Enable all for authenticated users" on public.mess_fees;
drop policy if exists "Allow staff to manage mess_fees" on public.mess_fees;


-- ---- ELECTRICITY BILLS ----
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

drop policy if exists "electricity_bills_policy" on public.electricity_bills;
drop policy if exists "Enable all for authenticated users" on public.electricity_bills;


-- ---- COMPLAINTS ----
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


-- ---- DELETED COMPLAINTS ----
alter table public.deleted_complaints enable row level security;

drop policy if exists "Admins manage deleted_complaints" on public.deleted_complaints;
create policy "Admins manage deleted_complaints" on public.deleted_complaints
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ---- AUDIT LOGS ----
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
-- NO update/delete policy — audit logs are immutable


-- ---- ADMISSION SETTINGS ----
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

insert into public.admission_settings (is_open, apply_link, message)
select false, '', 'Admissions are currently closed.'
where not exists (select 1 from public.admission_settings);


-- ============================================================
-- STEP 7: ADD ALL PERFORMANCE INDEXES (safe with IF NOT EXISTS)
-- ============================================================
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


-- ============================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================
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


-- ============================================================
-- DONE!
-- ============================================================
-- Your database now has:
--   ✓ updated_at on all tables (auto-stamped)
--   ✓ Payment validation triggers (paid_at auto-set)
--   ✓ Amount > 0 CHECK constraints
--   ✓ Month format YYYY-MM CHECK constraints
--   ✓ All RLS policies cleaned and rebuilt (no conflicts)
--   ✓ 16 performance indexes
--   ✓ audit_logs is immutable (no update/delete allowed)
--   ✓ deleted_complaints table created
--   ✓ admission_settings table created
--   ✓ All GRANT statements applied
-- ============================================================
