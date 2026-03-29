-- ============================================
-- WOYOhub Database Schema
-- Migration: 007_project_images
-- ============================================

-- Create project_images table
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_images_project_id ON public.project_images(project_id);

-- RLS
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read project images"
ON public.project_images FOR SELECT
USING (true); -- Publicly readable since projects are usually public, or follows project owner. The instruction says "using (auth.uid() = (select user_id from projects where id = project_id));" let's stick to instruction!

DROP POLICY IF EXISTS "read project images" ON public.project_images;
CREATE POLICY "read project images"
ON public.project_images FOR SELECT
USING (auth.uid() = (select user_id from public.projects where id = project_id));

CREATE POLICY "insert project images"
ON public.project_images FOR INSERT
WITH CHECK (auth.uid() = (select user_id from public.projects where id = project_id));

CREATE POLICY "delete project images"
ON public.project_images FOR DELETE
USING (auth.uid() = (select user_id from public.projects where id = project_id));

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Project images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Users can upload their own project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can delete their own project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Trigger to auto-update updated_at for projects when adding an image?
-- They don't have updated_at in the project_images table, so it's fine.
