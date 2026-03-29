-- ============================================
-- Migration 006: Roadmap node skills (many-to-many)
-- ============================================

CREATE TABLE public.roadmap_node_skills (
  node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, skill_id)
);

CREATE INDEX idx_roadmap_node_skills_node ON public.roadmap_node_skills(node_id);

ALTER TABLE public.roadmap_node_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roadmap node skills viewable"
  ON public.roadmap_node_skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Roadmap owners insert node skills"
  ON public.roadmap_node_skills FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmap_nodes n
      JOIN public.roadmaps r ON n.roadmap_id = r.id
      WHERE n.id = node_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Roadmap owners delete node skills"
  ON public.roadmap_node_skills FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmap_nodes n
      JOIN public.roadmaps r ON n.roadmap_id = r.id
      WHERE n.id = node_id AND r.user_id = auth.uid()
    )
  );

-- Optional: Drop the deprecated skill_id from roadmap_nodes if we want to migrate fully.
-- Usually we migrate data first if there is any, but assuming we can drop it.
-- We won't drop it just yet to prevent breaking existing API reads that haven't been updated.
-- We will ignore it for now.
