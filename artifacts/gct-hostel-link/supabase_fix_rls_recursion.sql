-- ============================================================
-- EMERGENCY FIX: Infinite Recursion in profiles RLS
-- ============================================================
-- PROBLEM:
--   The policies on the `profiles` table reference the
--   `profiles` table itself using subqueries like:
--     exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
--   This causes Postgres to recurse infinitely when trying
--   to read a profile record, making login impossible.
--
-- SOLUTION:
--   Create a SECURITY DEFINER function `get_my_role()` that
--   reads the current user's role while bypassing RLS.
--   Then update all `profiles` policies to use this function.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query
--   Paste this ENTIRE file → Run All
-- ============================================================


-- Step 1: Create the helper function (bypasses RLS via SECURITY DEFINER)
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- Step 2: Fix profiles policies — remove self-referencing subqueries
alter table public.profiles enable row level security;

-- View own profile (no recursion risk — just auth.uid() = id)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admin views all profiles — USE get_my_role() to avoid recursion
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (public.get_my_role() = 'admin');

-- Teachers/mess owners view student profiles
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

-- Anyone inserts own profile on signup
drop policy if exists "Anyone can insert own profile on signup" on public.profiles;
create policy "Anyone can insert own profile on signup" on public.profiles
  for insert with check (auth.uid() = id);

-- Step 3: Also fix other tables that reference profiles to use get_my_role()
-- (These don't cause recursion since they query profiles FROM a different table,
--  but using get_my_role() is more efficient — no join needed)

-- Deleted profiles
drop policy if exists "Admins manage deleted_profiles" on public.deleted_profiles;
create policy "Admins manage deleted_profiles" on public.deleted_profiles
  for all using (public.get_my_role() = 'admin');

-- Attendance
drop policy if exists "Staff can view all attendance" on public.attendance;
create policy "Staff can view all attendance" on public.attendance
  for select using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Teachers can insert attendance" on public.attendance;
create policy "Teachers can insert attendance" on public.attendance
  for insert with check (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Teachers can update unlocked attendance" on public.attendance;
create policy "Teachers can update unlocked attendance" on public.attendance
  for update using (
    public.get_my_role() = 'teacher'
    and is_locked = false
  );

drop policy if exists "Admins can update any attendance" on public.attendance;
create policy "Admins can update any attendance" on public.attendance
  for update using (public.get_my_role() = 'admin');

-- Mess fees
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

-- Electricity bills
drop policy if exists "Staff can view all electricity bills" on public.electricity_bills;
create policy "Staff can view all electricity bills" on public.electricity_bills
  for select using (public.get_my_role() in ('teacher', 'admin', 'mess_owner'));

drop policy if exists "Teachers and admins can manage electricity bills" on public.electricity_bills;
create policy "Teachers and admins can manage electricity bills" on public.electricity_bills
  for all using (public.get_my_role() in ('teacher', 'admin'))
  with check (public.get_my_role() in ('teacher', 'admin'));

-- Complaints
drop policy if exists "Students can view all complaints" on public.complaints;
create policy "Students can view all complaints" on public.complaints
  for select using (public.get_my_role() = 'student');

drop policy if exists "Staff can view all complaints with author" on public.complaints;
create policy "Staff can view all complaints with author" on public.complaints
  for select using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Staff can update complaints" on public.complaints;
create policy "Staff can update complaints" on public.complaints
  for update using (public.get_my_role() in ('teacher', 'admin'));

drop policy if exists "Admins can delete complaints" on public.complaints;
create policy "Admins can delete complaints" on public.complaints
  for delete using (public.get_my_role() = 'admin');

-- Deleted complaints
drop policy if exists "Admins manage deleted_complaints" on public.deleted_complaints;
create policy "Admins manage deleted_complaints" on public.deleted_complaints
  for all using (public.get_my_role() = 'admin');

-- Audit logs
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.get_my_role() = 'admin');

drop policy if exists "Staff can insert audit logs" on public.audit_logs;
create policy "Staff can insert audit logs" on public.audit_logs
  for insert with check (public.get_my_role() in ('admin', 'teacher', 'mess_owner'));

-- Admission settings
drop policy if exists "Admins can manage admission settings" on public.admission_settings;
create policy "Admins can manage admission settings" on public.admission_settings
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- DONE! Login should now work immediately.
-- The get_my_role() function reads your role without triggering
-- any RLS check, breaking the infinite recursion permanently.
-- ============================================================
