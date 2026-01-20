-- ==========================================
-- PHASE 9: ADMINISTRATION & MODERATION
-- ==========================================

-- 1. REPORTS TABLE
create table if not exists forum_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) not null,
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id uuid not null, -- Can reference forum_threads(id) or forum_comments(id)
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Reports
alter table forum_reports enable row level security;

-- Drop existing policies if they exist to avoid conflicts on re-run
drop policy if exists "Admins can view all reports" on forum_reports;
drop policy if exists "Authenticated users can create reports" on forum_reports;

create policy "Admins can view all reports"
  on forum_reports for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) ); -- Updated for super_admin

create policy "Authenticated users can create reports"
  on forum_reports for insert
  with check ( auth.role() = 'authenticated' );

-- 2. ADMIN LOGS
create table if not exists admin_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references profiles(id) not null,
  action text not null,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Logs
alter table admin_logs enable row level security;

drop policy if exists "Admins can view logs" on admin_logs;
drop policy if exists "Admins can insert logs" on admin_logs;

create policy "Admins can view logs"
  on admin_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

create policy "Admins can insert logs"
  on admin_logs for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

-- 3. USER BANNING & ROLES
-- Add is_banned column to profiles if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_banned') then
    alter table profiles add column is_banned boolean default false;
  end if;
end $$;

-- UPDATE ROLES CHECK CONSTRAINT
-- We need to update the check constraint for 'role' in the 'profiles' table to allow 'super_admin' and 'event_analyst'.
-- Since we can't easily ALTER CONSTRAINT with new values without dropping it, we'll try to drop the old check and add a new one.
-- Or if it's just a text column without a constraint (often simpler in Supabase starter), we don't need this.
-- However, strict schema usually has it. Let's assume there is one or we add one.
do $$
begin
    -- Try to drop constraint if it exists (generic name assumption or find it)
    -- Postgres constraint names are auto-generated often. 
    -- If you defined it in 'supabase_schema.sql' as `check (role in (...))`, it might be named `profiles_role_check`.
    if exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
        alter table profiles drop constraint profiles_role_check;
    end if;
    
    -- Add new constraint
    alter table profiles add constraint profiles_role_check 
    check (role in ('guest', 'user', 'high_level', 'admin', 'moderator', 'super_admin', 'event_analyst'));
end $$;


-- Update RLS policies to prevent banned users from posting
drop policy if exists "Authenticated users can create threads" on forum_threads;
create policy "Authenticated users can create threads"
  on forum_threads for insert
  with check ( auth.role() = 'authenticated' and not exists (select 1 from profiles where id = auth.uid() and is_banned = true) );

drop policy if exists "Authenticated users can create comments" on forum_comments;
create policy "Authenticated users can create comments"
  on forum_comments for insert
  with check ( auth.role() = 'authenticated' and not exists (select 1 from profiles where id = auth.uid() and is_banned = true) );

-- Allow admins to update/delete anything
drop policy if exists "Admins can delete any thread" on forum_threads;
create policy "Admins can delete any thread"
  on forum_threads for delete
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

drop policy if exists "Admins can delete any comment" on forum_comments;
create policy "Admins can delete any comment"
  on forum_comments for delete
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );


-- ==========================================
-- PHASE 10: PERFORMANCE OPTIMIZATIONS (V1)
-- ==========================================

-- Index Foreign Keys for faster Joins
create index if not exists idx_forum_threads_author on forum_threads(author_id);
create index if not exists idx_forum_threads_category on forum_threads(category);
create index if not exists idx_forum_comments_thread on forum_comments(thread_id);
create index if not exists idx_forum_comments_author on forum_comments(author_id);
create index if not exists idx_forum_comments_parent on forum_comments(parent_id);
create index if not exists idx_forum_likes_thread on forum_likes(thread_id);
create index if not exists idx_forum_likes_comment on forum_likes(comment_id);


-- ==========================================
-- PHASE 11: DATA SAFETY (SOFT DELETES)
-- ==========================================

-- 1. Add Soft Delete Columns to Threads
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'forum_threads' and column_name = 'deleted_at') then
    alter table forum_threads add column deleted_at timestamp with time zone;
    alter table forum_threads add column deleted_by uuid references profiles(id);
    alter table forum_threads add column deletion_reason text;
  end if;
end $$;

-- 2. Add Soft Delete Columns to Comments
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'forum_comments' and column_name = 'deleted_at') then
    alter table forum_comments add column deleted_at timestamp with time zone;
    alter table forum_comments add column deleted_by uuid references profiles(id);
    alter table forum_comments add column deletion_reason text;
  end if;
end $$;
