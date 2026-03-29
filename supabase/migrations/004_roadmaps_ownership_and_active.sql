-- ============================================
-- Migration 004: User-owned roadmaps + single active enrollment
-- ============================================

-- 1. Ownership: NULL = template/seed roadmap; set for user-created rows
ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

-- 2. Single active roadmap per user (dashboard + activate flow)
ALTER TABLE public.user_roadmaps
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Backfill: among incomplete enrollments, mark earliest started as active
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at) AS rn
  FROM public.user_roadmaps
  WHERE completed_at IS NULL
)
UPDATE public.user_roadmaps ur
SET is_active = (r.rn = 1)
FROM ranked r
WHERE ur.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roadmaps_one_active_per_user
  ON public.user_roadmaps (user_id)
  WHERE is_active = true;

-- 3. RLS: roadmaps — owners can create/update/delete their rows (templates stay read-only)
CREATE POLICY "Users can insert own roadmap definitions"
  ON public.roadmaps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own roadmap definitions"
  ON public.roadmaps FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own roadmap definitions"
  ON public.roadmaps FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 4. RLS: roadmap_skills — writable by roadmap owner
CREATE POLICY "Roadmap owners can insert roadmap skills"
  ON public.roadmap_skills FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Roadmap owners can update roadmap skills"
  ON public.roadmap_skills FOR UPDATE TO authenticated
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

CREATE POLICY "Roadmap owners can delete roadmap skills"
  ON public.roadmap_skills FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
