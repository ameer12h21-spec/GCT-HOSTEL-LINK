-- ============================================================
--  GCT Hostel Link — Complete Supabase Schema v4
--  Developer: Ameer Hamza Arshad
--  Institution: GCT TEVTA Hostel, Taxila
--  ============================================================
--  ✅ SAFE to run on a FRESH or EXISTING Supabase project
--  ✅ Uses IF NOT EXISTS + OR REPLACE everywhere
--  ✅ RLS recursion fix built in (get_my_role function)
--  ✅ All policies use get_my_role() — no self-referencing loops
--  ✅ Payment triggers enforce paid_at consistency automatically
--  ✅ Audit logs are append-only (no update/delete policy)
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → New Query
--    Paste this ENTIRE file → Click "Run All"
--
--  AFTER RUNNING (do these manually in the Dashboard):
--    1. Auth → Settings → Disable "Confirm email" (for easy testing)
--    2. Storage → New Bucket → name: "profile-photos"
--       Public: ON, Max file size: 3145728 (3 MB), MIME: image/*
--    3. Database → Replication → enable "mess_fees" and
--       "electricity_bills" tables for Realtime (live updates)
--    4. Sign up with your admin email at /signup
--    5. Run the "First Admin Setup" query at the bottom of this file
-- ============================================================


-- ============================================================
-- STEP 1: SECURITY DEFINER FUNCTION (fixes RLS recursion)
-- This is the most critical part. All policies use this
-- function instead of querying the profiles table directly.
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- ============================================================
-- STEP 2: HELPER TRIGGER FUNCTION (auto-updates updated_at)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  role            text        not null check (role in ('admin', 'teacher', 'mess_owner', 'student')),
  status          text        not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  email           text        not null,
  name            text        not null,
  secret_key      text,
  roll_number     text        unique,
  father_name     text,
  technology      text,
  room_no         text,
  shift           text        check (shift in ('1st', '2nd')),
  hostel          text        check (hostel in ('Jinnah', 'Iqbal')),
  phone           text,
  father_phone    text,
  address         text,
  profile_photo_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

-- Own profile (no recursion — just checks auth.uid())
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admin views all
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (public.get_my_role() = 'admin');

-- Teachers / Mess owners view students only
drop policy if exists "Teachers and mess_owners can view student profiles" on public.profiles;
create policy "Teachers and mess_owners can view student profiles" on public.profiles
  for select using (
    public.get_my_role() in ('teacher', 'mess_owner')
    and role = 'student'
  );

-- Users update own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admin updates any profile
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (public.get_my_role() = 'admin');

-- Admin deletes profiles
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (public.get_my_role() = 'admin');

-- Anyone inserts own profile (signup)
drop policy if exists "Anyone can insert own profile on signup" on public.profiles;
create policy "Anyone can insert own profile on signup" on public.profiles
  for insert with check (auth.uid() = id);


-- ============================================================
-- TABLE: deleted_profiles (Trash)
-- ============================================================
create table if not exists public.deleted_profiles (
  id                uuid        primary key,
  role              text,
  status            text,
  email             text,
  name              text,
  secret_key        text,
  roll_number       text,
  father_name       text,
  technology        text,
  room_no           text,
  shift             text,
  hostel            text,
  phone             text,
  father_phone      text,
  address           text,
  profile_photo_url text,
  created_at        timestamptz,
  updated_at        timestamptz,
  deleted_at        timestamptz not null default now(),
  deleted_by        uuid
);

alter table public.deleted_profiles enable row level security;

drop policy if exists "Admins manage deleted_profiles" on public.deleted_profiles;
create policy "Admins manage deleted_profiles" on public.deleted_profiles
  for all using (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: attendance
-- ============================================================
create table if not exists public.attendance (
  id          uuid    primary key default gen_random_uuid(),
  student_id  uuid    not null references public.profiles(id) on delete cascade,
  date        date    not null,
  status      text    not null check (status in ('present', 'absent', 'leave')),
  is_locked   boolean not null default false,
  marked_by   uuid    references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
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
  for select using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Teachers can insert attendance" on public.attendance;
create policy "Teachers can insert attendance" on public.attendance
  for insert with check (public.get_my_role() in ('teacher', 'admin'));

-- Teachers can only update unlocked records
drop policy if exists "Teachers can update unlocked attendance" on public.attendance;
create policy "Teachers can update unlocked attendance" on public.attendance
  for update using (
    public.get_my_role() = 'teacher'
    and is_locked = false
  );

-- Admins can update any attendance record (no lock restriction)
drop policy if exists "Admins can update any attendance" on public.attendance;
create policy "Admins can update any attendance" on public.attendance
  for update using (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: mess_fees
-- ⚠️  ON DELETE RESTRICT — student deletion is blocked if they
--     have fee records. Disable/archive the student instead.
-- ============================================================
create table if not exists public.mess_fees (
  id          uuid    primary key default gen_random_uuid(),
  student_id  uuid    not null references public.profiles(id) on delete restrict,
  month       text    not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount      numeric(10,2) not null check (amount > 0),
  status      text    not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at     timestamptz,
  set_by      uuid    references public.profiles(id) on delete set null,
  marked_by   uuid    references public.profiles(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(student_id, month)
);

drop trigger if exists mess_fees_updated_at on public.mess_fees;
create trigger mess_fees_updated_at
  before update on public.mess_fees
  for each row execute procedure public.set_updated_at();

-- Auto-enforce paid_at consistency at DB level
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
  for select using (public.get_my_role() in ('teacher', 'admin', 'mess_owner'));

drop policy if exists "Mess owners can manage mess fees" on public.mess_fees;
create policy "Mess owners can manage mess fees" on public.mess_fees
  for all using (public.get_my_role() = 'mess_owner')
  with check (public.get_my_role() = 'mess_owner');

drop policy if exists "Admins can manage mess fees" on public.mess_fees;
create policy "Admins can manage mess fees" on public.mess_fees
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: electricity_bills
-- ⚠️  ON DELETE RESTRICT — same protection as mess_fees
-- ============================================================
create table if not exists public.electricity_bills (
  id          uuid    primary key default gen_random_uuid(),
  student_id  uuid    not null references public.profiles(id) on delete restrict,
  month       text    not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount      numeric(10,2) not null check (amount > 0),
  status      text    not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at     timestamptz,
  set_by      uuid    references public.profiles(id) on delete set null,
  marked_by   uuid    references public.profiles(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(student_id, month)
);

drop trigger if exists electricity_bills_updated_at on public.electricity_bills;
create trigger electricity_bills_updated_at
  before update on public.electricity_bills
  for each row execute procedure public.set_updated_at();

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
  for select using (public.get_my_role() in ('teacher', 'admin', 'mess_owner'));

-- Teachers: INSERT + UPDATE only (teachers must NOT delete electricity bill records)
drop policy if exists "Teachers and admins can manage electricity bills" on public.electricity_bills;
drop policy if exists "Teachers can insert electricity bills" on public.electricity_bills;
drop policy if exists "Teachers can update electricity bills" on public.electricity_bills;
drop policy if exists "Admins can manage electricity bills" on public.electricity_bills;

create policy "Teachers can insert electricity bills" on public.electricity_bills
  for insert with check (public.get_my_role() = 'teacher');

create policy "Teachers can update electricity bills" on public.electricity_bills
  for update using (public.get_my_role() = 'teacher');

-- Admins: full control including delete
create policy "Admins can manage electricity bills" on public.electricity_bills
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: complaints
-- ============================================================
create table if not exists public.complaints (
  id          uuid  primary key default gen_random_uuid(),
  student_id  uuid  not null references public.profiles(id) on delete cascade,
  category    text  not null,
  subject     text  not null,
  description text  not null,
  status      text  not null default 'open' check (status in ('open', 'in_progress', 'fixed', 'cancelled')),
  reply       text,
  replied_by  uuid  references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists complaints_updated_at on public.complaints;
create trigger complaints_updated_at
  before update on public.complaints
  for each row execute procedure public.set_updated_at();

alter table public.complaints enable row level security;

-- Students can view ALL complaints so the community feed works (UI shows others as "Anonymous")
drop policy if exists "Students can view own complaints" on public.complaints;
drop policy if exists "Students can view all complaints anonymously" on public.complaints;
create policy "Students can view all complaints anonymously" on public.complaints
  for select using (public.get_my_role() = 'student');

drop policy if exists "Staff can view all complaints with author" on public.complaints;
create policy "Staff can view all complaints with author" on public.complaints
  for select using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Students can insert own complaints" on public.complaints;
create policy "Students can insert own complaints" on public.complaints
  for insert with check (
    auth.uid() = student_id
    and public.get_my_role() = 'student'
  );

drop policy if exists "Staff can update complaints" on public.complaints;
create policy "Staff can update complaints" on public.complaints
  for update using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Admins can delete complaints" on public.complaints;
create policy "Admins can delete complaints" on public.complaints
  for delete using (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: deleted_complaints (Trash)
-- ============================================================
create table if not exists public.deleted_complaints (
  id          uuid primary key,
  student_id  uuid,
  category    text,
  subject     text,
  description text,
  status      text,
  reply       text,
  replied_by  uuid,
  created_at  timestamptz,
  updated_at  timestamptz,
  deleted_at  timestamptz not null default now(),
  deleted_by  uuid
);

alter table public.deleted_complaints enable row level security;

drop policy if exists "Admins manage deleted_complaints" on public.deleted_complaints;
create policy "Admins manage deleted_complaints" on public.deleted_complaints
  for all using (public.get_my_role() = 'admin');


-- ============================================================
-- TABLE: audit_logs
-- Immutable — intentionally no update/delete policy.
-- Every financial change, reversal, and admin action is logged.
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid  primary key default gen_random_uuid(),
  table_name  text  not null,
  record_id   text  not null,
  field_name  text  not null,
  old_value   text,
  new_value   text,
  changed_by  uuid  references public.profiles(id) on delete set null,
  ip_address  text,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.get_my_role() = 'admin');

drop policy if exists "Staff can insert audit logs" on public.audit_logs;
create policy "Staff can insert audit logs" on public.audit_logs
  for insert with check (
    public.get_my_role() in ('admin', 'teacher', 'mess_owner')
  );
-- NOTE: No UPDATE or DELETE policy — audit logs are immutable by design


-- ============================================================
-- TABLE: admission_settings
-- ============================================================
create table if not exists public.admission_settings (
  id          uuid    primary key default gen_random_uuid(),
  is_open     boolean not null default false,
  apply_link  text    default '',
  message     text    default 'Admissions are currently closed. Check back soon.',
  updated_at  timestamptz not null default now(),
  updated_by  uuid    references public.profiles(id) on delete set null
);

drop trigger if exists admission_settings_updated_at on public.admission_settings;
create trigger admission_settings_updated_at
  before update on public.admission_settings
  for each row execute procedure public.set_updated_at();

alter table public.admission_settings enable row level security;

drop policy if exists "Anyone can view admission settings" on public.admission_settings;
create policy "Anyone can view admission settings" on public.admission_settings
  for select using (true);

drop policy if exists "Admins can manage admission settings" on public.admission_settings;
create policy "Admins can manage admission settings" on public.admission_settings
  for all using (public.get_my_role() = 'admin');

-- Ensure there is always exactly one settings row (WHERE NOT EXISTS prevents duplicates on re-run)
insert into public.admission_settings (is_open, apply_link, message)
select false, '', 'Admissions are currently closed. Check back soon for updates.'
where not exists (select 1 from public.admission_settings);


-- ============================================================
-- TABLE: site_settings
-- Single-row table storing all website customization as JSONB.
-- Readable by everyone (public landing page uses it).
-- Only admin can write.
-- ============================================================
create table if not exists public.site_settings (
  id          uuid    primary key default gen_random_uuid(),
  settings    jsonb   not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid    references public.profiles(id) on delete set null
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute procedure public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings" on public.site_settings
  for select using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');


-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
create index if not exists idx_profiles_role            on public.profiles(role);
create index if not exists idx_profiles_status          on public.profiles(status);
create index if not exists idx_profiles_role_status     on public.profiles(role, status);
create index if not exists idx_profiles_roll_number     on public.profiles(roll_number);

create index if not exists idx_attendance_student_date  on public.attendance(student_id, date);
create index if not exists idx_attendance_date          on public.attendance(date);
create index if not exists idx_attendance_locked        on public.attendance(is_locked);

create index if not exists idx_mess_fees_student_month  on public.mess_fees(student_id, month);
create index if not exists idx_mess_fees_month          on public.mess_fees(month);
create index if not exists idx_mess_fees_status         on public.mess_fees(status);
create index if not exists idx_mess_fees_month_status   on public.mess_fees(month, status);
create index if not exists idx_mess_fees_paid_at        on public.mess_fees(paid_at desc);

create index if not exists idx_elec_student_month       on public.electricity_bills(student_id, month);
create index if not exists idx_elec_month               on public.electricity_bills(month);
create index if not exists idx_elec_status              on public.electricity_bills(status);

create index if not exists idx_complaints_student       on public.complaints(student_id);
create index if not exists idx_complaints_status        on public.complaints(status);
create index if not exists idx_complaints_created       on public.complaints(created_at desc);

create index if not exists idx_audit_table_date         on public.audit_logs(table_name, created_at desc);
create index if not exists idx_audit_record             on public.audit_logs(record_id, table_name);
create index if not exists idx_audit_changed_by         on public.audit_logs(changed_by);


-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
grant usage on schema public to anon, authenticated;

-- Anon can read admission settings (public page shows open/closed)
grant select on public.admission_settings to anon;

-- Authenticated users get full access (RLS policies control the actual rules)
grant all on public.profiles              to authenticated;
grant all on public.deleted_profiles      to authenticated;
grant all on public.attendance            to authenticated;
grant all on public.mess_fees             to authenticated;
grant all on public.electricity_bills     to authenticated;
grant all on public.complaints            to authenticated;
grant all on public.deleted_complaints    to authenticated;
grant all on public.audit_logs            to authenticated;
grant all on public.admission_settings    to authenticated;
grant all on public.site_settings         to authenticated;

-- Anon can read site_settings (needed for public landing page before login)
grant select on public.site_settings to anon;


-- ============================================================
-- DEFAULT ROW: site_settings (must exist for app to read/update)
-- ============================================================
insert into public.site_settings (settings)
select '{}'::jsonb
where not exists (select 1 from public.site_settings);


-- ============================================================
-- REALTIME (enables live fee/attendance updates across sessions)
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mess_fees;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.electricity_bills;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;


-- ============================================================
-- STORAGE BUCKET SETUP (do this manually in the Dashboard)
-- ============================================================
-- Dashboard → Storage → New Bucket
--   Name:       profile-photos
--   Public:     ON
--   Max size:   3145728  (3 MB)
--   MIME types: image/*
--
-- Then run the SQL below to add all storage policies automatically.
-- ============================================================

-- Storage RLS policies for profile-photos bucket
-- 1. Public read (anyone can view photos and logos)
DROP POLICY IF EXISTS "Public read profile-photos" ON storage.objects;
CREATE POLICY "Public read profile-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- 2. Authenticated users upload to their own UUID folder (userId/filename)
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Users can update/replace their own files
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
CREATE POLICY "Users update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Users can delete their own files
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- FIRST ADMIN SETUP
-- After running this schema:
--   1. Go to your app and sign up at /signup with the admin email
--   2. Run the query below (replace the email):
-- ============================================================
--
-- update public.profiles
-- set status = 'active', role = 'admin', secret_key = 'ADMIN-001'
-- where email = 'your-admin-email@example.com';
--
-- ============================================================
-- SETUP CHECKLIST
-- ============================================================
-- [1] ✅ Run THIS file in SQL Editor (realtime now enabled automatically)
-- [2] Auth → Settings → Disable "Confirm email"
-- [3] Storage → New Bucket "profile-photos" (public, 3MB, image/*)
-- [4] Storage → Add 4 policies (see STORAGE BUCKET SETUP section above)
-- [5] Sign up at /signup with your admin email
-- [6] Run the First Admin Setup query above
-- [7] Log in as admin and you are ready
-- ============================================================
