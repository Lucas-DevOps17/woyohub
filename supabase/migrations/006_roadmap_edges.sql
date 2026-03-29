CREATE TABLE public.roadmap_edges (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    roadmap_id UUID NOT NULL,
    source_node_id UUID NOT NULL,
    target_node_id UUID NOT NULL,
    CONSTRAINT fk_roadmap FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps (id) ON DELETE CASCADE,
    CONSTRAINT fk_source_node FOREIGN KEY (source_node_id) REFERENCES public.roadmap_nodes (id) ON DELETE CASCADE,
    CONSTRAINT fk_target_node FOREIGN KEY (target_node_id) REFERENCES public.roadmap_nodes (id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.roadmap_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roadmap edges are viewable by authenticated users"
  ON public.roadmap_edges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Roadmap owners can insert edges"
  ON public.roadmap_edges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Roadmap owners can delete edges"
  ON public.roadmap_edges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
