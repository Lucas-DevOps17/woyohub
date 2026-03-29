-- Restrict roadmap visibility to the roadmap owner.
-- Custom skills are already owner-scoped; this migration hardens roadmap reads too.

drop policy if exists "Roadmaps are publicly viewable" on public.roadmaps;
drop policy if exists "Roadmaps are viewable by authenticated users" on public.roadmaps;

create policy "Users can view own roadmap definitions"
on public.roadmaps
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Roadmap skills are publicly viewable" on public.roadmap_skills;
drop policy if exists "Roadmap skills are viewable" on public.roadmap_skills;

create policy "Roadmap owners can view roadmap skills"
on public.roadmap_skills
for select
to authenticated
using (
  exists (
    select 1
    from public.roadmaps r
    where r.id = roadmap_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists "Roadmap nodes viewable" on public.roadmap_nodes;

create policy "Roadmap owners can view nodes"
on public.roadmap_nodes
for select
to authenticated
using (
  exists (
    select 1
    from public.roadmaps r
    where r.id = roadmap_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists "Roadmap edges are viewable" on public.roadmap_edges;
drop policy if exists "Roadmap owners can view edges" on public.roadmap_edges;

create policy "Roadmap owners can view edges"
on public.roadmap_edges
for select
to authenticated
using (
  exists (
    select 1
    from public.roadmaps r
    where r.id = roadmap_id
      and r.user_id = auth.uid()
  )
);
