-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES & AUTHENTICATION
-- ==========================================

create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  reputation_points int default 0,
  -- Unified Role Definition
  role text default 'user' check (role in ('guest', 'user', 'high_level', 'admin', 'moderator', 'super_admin', 'event_analyst')),
  is_banned boolean default false, -- Included directly
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, new.raw_user_meta_data ->> 'username', 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. FORUM THREADS
-- ==========================================

create table forum_threads (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references profiles(id) not null,
  category text not null,
  tags text[] default '{}',
  likes_count int default 0,
  reply_count int default 0,
  is_pinned boolean default false,
  is_locked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_activity_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Threads
alter table forum_threads enable row level security;

create policy "Threads are viewable by everyone"
  on forum_threads for select
  using ( true );

-- Unified Insert Policy (Authenticated & Not Banned)
create policy "Authenticated users can create threads"
  on forum_threads for insert
  with check ( 
    auth.role() = 'authenticated' 
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true) 
  ); 

create policy "Users can update their own threads"
  on forum_threads for update
  using ( auth.uid() = author_id );

-- Unified Delete Policy (Author OR Admin/SuperAdmin)
create policy "delete_policy_threads"
  on forum_threads for delete
  using ( 
    auth.uid() = author_id 
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) 
  );

-- ==========================================
-- 3. FORUM COMMENTS
-- ==========================================

create table forum_comments (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references forum_threads(id) on delete cascade not null,
  author_id uuid references profiles(id) not null,
  content text not null,
  parent_id uuid references forum_comments(id) on delete cascade, -- Nullable for top-level
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Comments
alter table forum_comments enable row level security;

create policy "Comments are viewable by everyone"
  on forum_comments for select
  using ( true );

-- Unified Insert Policy (Authenticated & Not Banned)
create policy "Authenticated users can create comments"
  on forum_comments for insert
  with check ( 
    auth.role() = 'authenticated' 
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true) 
  );

create policy "Users can update their own comments"
  on forum_comments for update
  using ( auth.uid() = author_id );

-- Unified Delete Policy (Author OR Admin/SuperAdmin)
create policy "delete_policy_comments"
  on forum_comments for delete
  using ( 
    auth.uid() = author_id 
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) 
  );

-- ==========================================
-- 4. FORUM LIKES
-- ==========================================

create table forum_likes (
  user_id uuid references profiles(id) not null,
  thread_id uuid references forum_threads(id) on delete cascade,
  comment_id uuid references forum_comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, thread_id, comment_id), 
  check (
    (thread_id is not null and comment_id is null) or
    (thread_id is null and comment_id is not null)
  )
);

alter table forum_likes enable row level security;

create policy "Likes are viewable by everyone"
  on forum_likes for select
  using ( true );

create policy "Authenticated users can insert likes"
  on forum_likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes"
  on forum_likes for delete
  using ( auth.uid() = user_id );


-- ==========================================
-- 5. FORUM POLLS & VOTES
-- ==========================================

create table forum_polls (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references forum_threads(id) on delete cascade not null,
  question text not null,
  options jsonb not null, 
  allow_multiple boolean default false,
  status text default 'active' check (status in ('active', 'closed')),
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table forum_polls enable row level security;

create policy "Polls are viewable by everyone"
  on forum_polls for select
  using ( true );

create policy "Authenticated users can create polls"
  on forum_polls for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authors and Admins can delete polls"
  on forum_polls for delete
  using ( 
    exists ( select 1 from forum_threads where forum_threads.id = forum_polls.thread_id and forum_threads.author_id = auth.uid() ) 
    or exists ( select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin') )
  );

create policy "Authors can update their polls"
  on forum_polls for update
  using ( exists ( select 1 from forum_threads where forum_threads.id = forum_polls.thread_id and forum_threads.author_id = auth.uid() ) );


create table forum_poll_votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references forum_polls(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  option_id text not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poll_id, user_id, option_id) 
);

alter table forum_poll_votes enable row level security;

create policy "Poll votes are viewable by everyone"
  on forum_poll_votes for select
  using ( true );

create policy "Authenticated users can vote"
  on forum_poll_votes for insert
  with check ( auth.role() = 'authenticated' );


-- ==========================================
-- 6. ADMINISTRATION & MODERATION (Phase 9)
-- ==========================================

-- Reports Table
create table forum_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) not null,
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id uuid not null, 
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table forum_reports enable row level security;

create policy "Admins View Reports"
  on forum_reports for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

create policy "Users Create Reports"
  on forum_reports for insert
  with check ( auth.role() = 'authenticated' );

-- Admin Logs
create table admin_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references profiles(id) not null,
  action text not null,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table admin_logs enable row level security;

create policy "Admins View Logs"
  on admin_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

create policy "Admins Insert Logs"
  on admin_logs for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );


-- ==========================================
-- 7. REPUTATION & TRIGGERS
-- ==========================================

-- Function to safely increment reputation
create or replace function public.update_reputation(
  target_user_id uuid,
  points int
)
returns void
language plpgsql
security definer 
as $$
begin
  update public.profiles
  set reputation_points = reputation_points + points
  where id = target_user_id;
end;
$$;

-- Trigger: Thread Creation (+5 Points)
create or replace function public.on_thread_created_rep()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.update_reputation(new.author_id, 5);
  return new;
end;
$$;

create trigger tr_thread_created_rep
  after insert on public.forum_threads
  for each row execute procedure public.on_thread_created_rep();

-- Trigger: Comment Creation (+1 Point)
create or replace function public.on_comment_created_rep()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.update_reputation(new.author_id, 1);
  return new;
end;
$$;

create trigger tr_comment_created_rep
  after insert on public.forum_comments
  for each row execute procedure public.on_comment_created_rep();

-- Trigger: Like (+1 Point)
create or replace function public.on_like_received_rep()
returns trigger
language plpgsql
security definer
as $$
declare
  target_author_id uuid;
begin
  if new.thread_id is not null then
    select author_id into target_author_id from public.forum_threads where id = new.thread_id;
  elsif new.comment_id is not null then
    select author_id into target_author_id from public.forum_comments where id = new.comment_id;
  end if;

  if target_author_id is not null then
    perform public.update_reputation(target_author_id, 1);
  end if;

  return new;
end;
$$;

create trigger tr_like_received_rep
  after insert on public.forum_likes
  for each row execute procedure public.on_like_received_rep();


-- ==========================================
-- 8. ENGAGEMENT & NOTIFICATIONS
-- ==========================================

-- Thread Views
create table forum_thread_views (
  user_id uuid references profiles(id) on delete cascade not null,
  thread_id uuid references forum_threads(id) on delete cascade not null,
  last_viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, thread_id)
);

alter table forum_thread_views enable row level security;

create policy "Users view own read status"
  on forum_thread_views for select
  using ( auth.uid() = user_id );

create policy "Users update own read status"
  on forum_thread_views for insert
  with check ( auth.uid() = user_id );

create policy "Users update own read status (update)"
  on forum_thread_views for update
  using ( auth.uid() = user_id );

-- Notifications
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,         
  actor_id uuid references profiles(id) not null,        
  type text not null check (type in ('reply_thread', 'reply_comment', 'mention', 'like')),
  resource_id uuid not null,                             
  resource_slug text not null,                           
  content_preview text,                                  
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;
create policy "Users view own notifications" on notifications for select using ( auth.uid() = user_id );
create policy "Users update own notifications" on notifications for update using ( auth.uid() = user_id );

-- Bookmarks
create table forum_bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  thread_id uuid references forum_threads(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, thread_id)
);

alter table forum_bookmarks enable row level security;
create policy "Users view own bookmarks" on forum_bookmarks for select using ( auth.uid() = user_id );
create policy "Users manage own bookmarks" on forum_bookmarks for insert with check ( auth.uid() = user_id );
create policy "Users delete own bookmarks" on forum_bookmarks for delete using ( auth.uid() = user_id );

-- Realtime Publications
alter publication supabase_realtime add table forum_comments;
alter publication supabase_realtime add table notifications;


-- ==========================================
-- 9. NOTIFICATION TRIGGERS
-- ==========================================

create or replace function public.handle_new_comment_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  thread_owner_id uuid;
  parent_owner_id uuid;
  preview_text text;
begin
  select author_id into thread_owner_id from public.forum_threads where id = new.thread_id;
  preview_text := substring(new.content from 1 for 50);
  
  if thread_owner_id is not null and thread_owner_id != new.author_id then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_slug, content_preview)
    values (thread_owner_id, new.author_id, 'reply_thread', new.id, new.thread_id::text, preview_text);
  end if;

  if new.parent_id is not null then
    select author_id into parent_owner_id from public.forum_comments where id = new.parent_id;
    if parent_owner_id is not null and parent_owner_id != new.author_id and parent_owner_id != thread_owner_id then
      insert into public.notifications (user_id, actor_id, type, resource_id, resource_slug, content_preview)
      values (parent_owner_id, new.author_id, 'reply_comment', new.id, new.thread_id::text, preview_text);
    end if;
  end if;
  return new;
end;
$$;

create trigger tr_comment_notification
  after insert on public.forum_comments

-- ==========================================
-- 10. ROLE SYSTEM EXPANSION (Verified)
-- ==========================================

-- 10.1 FORUM CATEGORIES
create table if not exists forum_categories (
  slug text primary key,
  name text not null,
  description text,
  is_restricted boolean default false,
  min_role text default 'user', 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table forum_categories enable row level security;
create policy "Categories are viewable by everyone" on forum_categories for select using (true);

-- Seed Initial Categories
insert into forum_categories (slug, name, description) values
('general', 'General Discussion', 'Talk about anything related to markets.'),
('equities', 'Equities', 'Indian and Global Stock Markets.'),
('forex', 'Forex', 'Currency Trading and Analysis.'),
('commodities', 'Commodities', 'Gold, Oil, and other commodities.'),
('fno', 'F&O', 'Futures and Options Trading strategies.'),
('crypto', 'Crypto', 'Bitcoin and altcoins discussion.'),
('vip_lounge', 'VIP Lounge', 'Exclusive discussions for High Level members.')
on conflict (slug) do nothing;

-- 10.2 CATEGORY STEWARDS
create table if not exists category_moderators (
  category_slug text references forum_categories(slug) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  assigned_by uuid references profiles(id),
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (category_slug, user_id)
);

alter table category_moderators enable row level security;
create policy "Moderator assignments viewable by everyone" on category_moderators for select using (true);
create policy "Admins manage moderators" on category_moderators for all 
using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

-- 10.3 BADGES
create table if not exists badges (
  slug text primary key,
  name text not null,
  icon_name text not null,
  color text not null,
  description text
);

alter table badges enable row level security;
create policy "Badges viewable by everyone" on badges for select using (true);

insert into badges (slug, name, icon_name, color, description) values
('steward', 'Category Steward', 'ShieldCheck', 'text-emerald-400', 'Official Moderator for specific categories'),
('high_roller', 'High Level Member', 'Gem', 'text-purple-400', 'Distinguished community member'),
('early_adopter', 'Early Adopter', 'Rocket', 'text-blue-400', 'One of the first members'),
('top_voice', 'Top Contributor', 'Megaphone', 'text-red-400', 'Recognized for high quality contributions'),
('analyst', 'Event Analyst', 'LineChart', 'text-cyan-400', 'Certified Economic Event Analyst')
on conflict (slug) do nothing;

create table if not exists user_badges (
  user_id uuid references profiles(id) on delete cascade not null,
  badge_slug text references badges(slug) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, badge_slug)
);

alter table user_badges enable row level security;
create policy "User badges viewable by everyone" on user_badges for select using (true);
create policy "Admins manage user badges" on user_badges for all 
using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

-- 10.4 STEWARD PERMISSIONS
create policy "Stewards can delete threads in their category"
  on forum_threads for delete
  using (
    exists (
      select 1 from category_moderators
      where category_slug = forum_threads.category
      and user_id = auth.uid()
    )
  );

create policy "Stewards can delete comments in their category"
  on forum_comments for delete
  using (
    exists (
      select 1 from category_moderators cm
      join forum_threads t on t.category = cm.category_slug
      where t.id = forum_comments.thread_id
      and cm.user_id = auth.uid()
    )
  );

-- 10.5 FINAL SYNC & CONSTRAINTS
-- Ensure data integrity for Categories
update forum_threads set category = 'general' where category not in (select slug from forum_categories);

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'fk_category') then
        alter table forum_threads 
        add constraint fk_category 
        foreign key (category) 
        references forum_categories(slug) 
        on update cascade 
        on delete restrict;
    end if;
end $$;

alter publication supabase_realtime add table forum_categories;
