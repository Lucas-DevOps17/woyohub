-- ============================================
-- Migration 011: skills CRUD policies
-- Description: allow authenticated users to update and delete skills
-- ============================================

create policy "Users can update skills"
  on public.skills
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Users can delete skills"
  on public.skills
  for delete
  to authenticated
  using (true);
