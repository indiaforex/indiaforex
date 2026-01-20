
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
