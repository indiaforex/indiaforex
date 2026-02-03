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

create policy "Admins can update any thread"
  on forum_threads for update
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

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

create policy "Admins can update any comment"
  on forum_comments for update
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

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
  for each row execute procedure public.handle_new_comment_notification();

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


-- ==========================================
-- PHASE 12: REPUTATION SCALABILITY
-- ==========================================

-- 1. Create Logs Table
create table if not exists reputation_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) not null,
    points int not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reputation_logs enable row level security;
create policy "Admins view logs" on reputation_logs for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')));

-- 2. Modify Update Function to Log instead of Direct Update
create or replace function public.update_reputation(
  target_user_id uuid,
  points int
)
returns void
language plpgsql
security definer 
as $$
begin
  insert into public.reputation_logs (user_id, points)
  values (target_user_id, points);
end;
$$;

-- 3. Batch Processing Function (Atomic)
create or replace function public.process_reputation_logs()
returns void
language plpgsql
security definer
as $$
begin
    with deleted_rows as (
        delete from public.reputation_logs
        returning user_id, points
    ),
    aggregated as (
        select user_id, sum(points) as total
        from deleted_rows
        group by user_id
    )
    update public.profiles
    set reputation_points = profiles.reputation_points + aggregated.total
    from aggregated
    where profiles.id = aggregated.user_id;
end;
$$;


-- ==========================================
-- PHASE 2: MARKET DATA ENGINE (Time-Series)
-- ==========================================

-- 1. Market Candles Table
-- Stores OHLC+Volume data.
-- Designed to be compatible with TimescaleDB (if enabled later).
create table if not exists market_candles (
    symbol text not null,
    interval text not null, -- '1m', '5m', '1h', '1d'
    bucket timestamp with time zone not null,
    open numeric(18, 6),
    high numeric(18, 6),
    low numeric(18, 6),
    close numeric(18, 6),
    volume bigint,
    primary key (symbol, interval, bucket)
);

-- 2. Indexes for Performance (Standard Postgres fallback)
-- Efficient for querying "Last 50 candles for USDINR"
create index if not exists idx_market_candles_query 
  on market_candles (symbol, interval, bucket desc);

-- 3. RLS (Public Read, Admin Write)
alter table market_candles enable row level security;

create policy "Market Data viewable by everyone"
  on market_candles for select
  using ( true );

create policy "Workers/Admins can insert market data"
  on market_candles for insert
  with check ( 
    -- For workers using Service Role key, this is bypassed.
    -- For manual admin tools:
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin', 'high_level')) 
  );



-- ==========================================
-- 7. PREDICTION POOLS (PHASE 3)
-- ==========================================

create table if not exists prediction_markets (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,          -- e.g. "USDINR=X"
    target_date date not null,     -- e.g. "2024-02-14"
    open_price numeric not null,   -- Price at start of day
    question text,                 -- Specific question text (optional)
    status text default 'OPEN',    -- OPEN, CLOSED, SETTLED
    resolution_price numeric,      -- Final outcome price
    winner text,                   -- 'UP' or 'DOWN'
    created_at timestamptz default now()
);

alter table prediction_markets enable row level security;
create policy "Public markets are viewable by everyone" on prediction_markets for select using (true);
create policy "Admins can manage markets" on prediction_markets for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create table if not exists market_bets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    market_id uuid references prediction_markets(id) not null,
    direction text not null check (direction in ('UP', 'DOWN')),
    amount numeric not null check (amount > 0),
    payout numeric,                -- Null until settled
    status text default 'PENDING',  -- PENDING, WON, LOST
    created_at timestamptz default now()
);

alter table market_bets enable row level security;
create policy "Users can view their own bets" on market_bets for select using (auth.uid() = user_id);
create policy "Users can place bets" on market_bets for insert with check (auth.uid() = user_id);


-- ==========================================
-- 8. QUANT WORKSPACE (PHASE 4)
-- ==========================================

create table if not exists user_alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    symbol text not null,
    condition text not null check (condition in ('ABOVE', 'BELOW')),
    target_price numeric not null,
    status text default 'ACTIVE' check (status in ('ACTIVE', 'TRIGGERED', 'DISABLED')),
    created_at timestamptz default now()
);

alter table user_alerts enable row level security;
create policy "Users manage own alerts" on user_alerts for all using (auth.uid() = user_id);


-- ==========================================
-- PHASE 5: GAMIFICATION & LEADERBOARD
-- ==========================================

create table if not exists achievements (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    description text not null,
    icon text not null, -- Lucide icon name
    xp_reward int default 50,
    created_at timestamptz default now()
);

alter table achievements enable row level security;
create policy "Achievements viewable by everyone" on achievements for select using (true);
create policy "Admins can manage achievements" on achievements for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create table if not exists user_achievements (
    user_id uuid references profiles(id) not null,
    achievement_id uuid references achievements(id) not null,
    unlocked_at timestamptz default now(),
    primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;
create policy "User achievements viewable by everyone" on user_achievements for select using (true);
create policy "System can grant achievements" on user_achievements for insert with check (false); 
-- Note: Set to false so only Service Role (Workers) can grant achievements.

-- Seed Data
insert into achievements (slug, name, description, icon, xp_reward) values
('first_win', 'First Blood', 'Win your first prediction market bet.', 'Swords', 100),
('high_roller', 'High Roller', 'Place a bet of over 1000 reputation.', 'Gem', 500),
('streak_3', 'Hot Hand', 'Win 3 bets in a row.', 'Flame', 250),
('early_bird', 'Early Bird', 'Join the platform during beta.', 'Egg', 50)
on conflict (slug) do nothing;

-- Phase 5.5: Betting Configuration
ALTER TABLE prediction_markets 
ADD COLUMN IF NOT EXISTS bet_config JSONB DEFAULT '{"presets": [100, 500, 1000], "allow_custom": true, "min": 1, "max": 10000}';
