-- Allow Admins and Super Admins to UPDATE forum_comments (Required for Soft Delete)
drop policy if exists "Admins can update any comment" on forum_comments;
create policy "Admins can update any comment"
  on forum_comments for update
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );

-- Allow Admins and Super Admins to UPDATE forum_threads (Required for Soft Delete)
drop policy if exists "Admins can update any thread" on forum_threads;
create policy "Admins can update any thread"
  on forum_threads for update
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );
