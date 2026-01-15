-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  reputation_points int default 0,
  role text default 'user' check (role in ('guest', 'user', 'high_level', 'admin')),
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
create function public.handle_new_user()
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


-- 2. FORUM THREADS
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

create policy "Authenticated users can create threads"
  on forum_threads for insert
  with check ( auth.role() = 'authenticated' ); 
  -- Note: If you want to restrict to 'high_level' roles, you'd check profiles table here using a subquery or custom claim.

create policy "Users can update their own threads"
  on forum_threads for update
  using ( auth.uid() = author_id );


-- 3. FORUM COMMENTS
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

create policy "Authenticated users can create comments"
  on forum_comments for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own comments"
  on forum_comments for update
  using ( auth.uid() = author_id );


-- 4. FORUM LIKES (Polymorphic-ish or specific)
create table forum_likes (
  user_id uuid references profiles(id) not null,
  thread_id uuid references forum_threads(id) on delete cascade,
  comment_id uuid references forum_comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, thread_id, comment_id), -- Composite PK ensuring unique likes
  check (
    (thread_id is not null and comment_id is null) or
    (thread_id is null and comment_id is not null)
  )
);

-- RLS for Likes
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

-- Optional: Function to increment/decrement counts automatically via triggers
