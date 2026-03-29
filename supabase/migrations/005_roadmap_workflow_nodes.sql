-- ============================================
-- Migration 005: Visual roadmap workflow (nodes + per-user completion)
-- ============================================

-- 1. Roadmap nodes (shared layout; ownership via parent roadmaps.user_id)
CREATE TABLE public.roadmap_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_nodes_roadmap ON public.roadmap_nodes(roadmap_id);

-- 2. Per-user completion for shared node definitions
CREATE TABLE public.user_roadmap_node_state (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id)
);

CREATE INDEX idx_user_roadmap_node_state_node ON public.user_roadmap_node_state(node_id);

-- 3. RLS: roadmap_nodes
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roadmap nodes viewable"
  ON public.roadmap_nodes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Roadmap owners insert nodes"
  ON public.roadmap_nodes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Roadmap owners update nodes"
  ON public.roadmap_nodes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Roadmap owners delete nodes"
  ON public.roadmap_nodes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );

-- 4. RLS: user_roadmap_node_state
ALTER TABLE public.user_roadmap_node_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own roadmap node state"
  ON public.user_roadmap_node_state FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own roadmap node state"
  ON public.user_roadmap_node_state FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own roadmap node state"
  ON public.user_roadmap_node_state FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own roadmap node state"
  ON public.user_roadmap_node_state FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. xp_logs: allow roadmap_node source
ALTER TABLE public.xp_logs DROP CONSTRAINT IF EXISTS xp_logs_source_type_check;
ALTER TABLE public.xp_logs ADD CONSTRAINT xp_logs_source_type_check
  CHECK ( source_type IN ('lesson', 'course', 'project', 'daily_login', 'achievement', 'roadmap_node') );
