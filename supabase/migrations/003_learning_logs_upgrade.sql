-- ============================================
-- Migration 003: Learning Logs Upgrade
-- ============================================
-- Adds units_completed to learning_logs.
-- Adds learning_log_skills junction table.
-- Allows authenticated users to insert custom skills.

-- 1. Add units_completed to learning_logs
ALTER TABLE public.learning_logs
  ADD COLUMN IF NOT EXISTS units_completed INTEGER NOT NULL DEFAULT 0;

-- 2. Junction table: learning_log_skills
CREATE TABLE IF NOT EXISTS public.learning_log_skills (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_log_id  UUID NOT NULL REFERENCES public.learning_logs(id) ON DELETE CASCADE,
  skill_id         UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE(learning_log_id, skill_id)
);

ALTER TABLE public.learning_log_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning log skills"
  ON public.learning_log_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_logs ll
      WHERE ll.id = learning_log_id AND ll.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own learning log skills"
  ON public.learning_log_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_logs ll
      WHERE ll.id = learning_log_id AND ll.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own learning log skills"
  ON public.learning_log_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_logs ll
      WHERE ll.id = learning_log_id AND ll.user_id = auth.uid()
    )
  );

-- 3. Allow authenticated users to insert custom skills
CREATE POLICY "Users can insert custom skills"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_learning_log_skills_log
  ON public.learning_log_skills(learning_log_id);
