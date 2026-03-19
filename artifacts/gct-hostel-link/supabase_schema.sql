-- ============================================================
-- GCT Hostel Link — Supabase Schema
-- Developer: Ameer Hamza Arshad
-- Institution: GCT TEVTA Hostel, Taxila
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
  roll_number text,
  father_name text,
  technology text,
  room_no text,
  shift text check (shift in ('1st', '2nd')),
  hostel text check (hostel in ('Jinnah', 'Iqbal')),
  phone text,
  father_phone text,
  address text,
  profile_photo_url text,
  created_at timestamptz not null default now()
);

-- RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Teachers and mess_owners can view student profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'mess_owner'))
    and role = 'student'
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

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
  deleted_at timestamptz not null default now()
);

alter table public.deleted_profiles enable row level security;

create policy "Admins manage deleted_profiles" on public.deleted_profiles
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

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
  unique(student_id, date)
);

alter table public.attendance enable row level security;

create policy "Students can view own attendance" on public.attendance
  for select using (auth.uid() = student_id);

create policy "Teachers can view all attendance" on public.attendance
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

create policy "Teachers can insert attendance" on public.attendance
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

create policy "Teachers can update unlocked attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
    and is_locked = false
  );

create policy "Admins can update any attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-lock attendance after 3 days (via cron or application logic)
-- Application sets is_locked = true when date is older than 3 days

-- ===================
-- MESS FEES TABLE
-- ===================
create table if not exists public.mess_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  month text not null, -- format: YYYY-MM
  amount numeric(10,2) not null default 7780,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at timestamptz,
  set_by uuid references public.profiles(id),
  marked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(student_id, month)
);

alter table public.mess_fees enable row level security;

create policy "Students can view own mess fees" on public.mess_fees
  for select using (auth.uid() = student_id);

create policy "Staff can view all mess fees" on public.mess_fees
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin', 'mess_owner'))
  );

create policy "Mess owners and admins can manage mess fees" on public.mess_fees
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('mess_owner', 'admin'))
  );

-- ===================
-- ELECTRICITY BILLS TABLE
-- ===================
create table if not exists public.electricity_bills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  month text not null, -- format: YYYY-MM
  amount numeric(10,2) not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at timestamptz,
  set_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(student_id, month)
);

alter table public.electricity_bills enable row level security;

create policy "Students can view own electricity bills" on public.electricity_bills
  for select using (auth.uid() = student_id);

create policy "Staff can view all electricity bills" on public.electricity_bills
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin', 'mess_owner'))
  );

create policy "Teachers and admins can manage electricity bills" on public.electricity_bills
  for all using (
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
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

-- Students can see all complaints (anonymized by app layer)
create policy "Students can view all complaints" on public.complaints
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

create policy "Staff can view all complaints with author" on public.complaints
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

create policy "Students can insert own complaints" on public.complaints
  for insert with check (
    auth.uid() = student_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

create policy "Staff can update complaints" on public.complaints
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

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
  created_at timestamptz,
  deleted_at timestamptz not null default now(),
  deleted_by text
);

alter table public.deleted_complaints enable row level security;

create policy "Admins manage deleted_complaints" on public.deleted_complaints
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ===================
-- AUDIT LOGS TABLE
-- ===================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Staff can insert audit logs" on public.audit_logs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher', 'mess_owner'))
  );

-- ===================
-- ADMISSION SETTINGS TABLE
-- ===================
create table if not exists public.admission_settings (
  id uuid primary key default gen_random_uuid(),
  is_open boolean not null default false,
  apply_link text,
  message text,
  updated_at timestamptz not null default now()
);

alter table public.admission_settings enable row level security;

-- Anyone can view (public page reads this)
create policy "Anyone can view admission settings" on public.admission_settings
  for select using (true);

create policy "Admins can manage admission settings" on public.admission_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Insert default row
insert into public.admission_settings (is_open, apply_link, message)
values (false, '', 'Admissions are currently closed. Check back soon for updates.')
on conflict do nothing;

-- ===================
-- STORAGE BUCKET (run manually in Supabase Dashboard > Storage)
-- ===================
-- Create bucket: profile-photos
-- Public: true (or restrict via policies)
-- Max file size: 3MB
-- Allowed MIME types: image/*

-- ===================
-- INDEXES (optional performance)
-- ===================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_attendance_student_date on public.attendance(student_id, date);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_mess_fees_student_month on public.mess_fees(student_id, month);
create index if not exists idx_electricity_student_month on public.electricity_bills(student_id, month);
create index if not exists idx_complaints_student on public.complaints(student_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_audit_logs_table on public.audit_logs(table_name, created_at);
