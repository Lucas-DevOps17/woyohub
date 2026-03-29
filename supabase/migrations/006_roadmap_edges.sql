
CREATE TABLE roadmap_edges (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    roadmap_id BIGINT NOT NULL,
    source_node_id BIGINT NOT NULL,
    target_node_id BIGINT NOT NULL,
    CONSTRAINT fk_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps (id) ON DELETE CASCADE,
    CONSTRAINT fk_source_node FOREIGN KEY (source_node_id) REFERENCES roadmap_nodes (id) ON DELETE CASCADE,
    CONSTRAINT fk_target_node FOREIGN KEY (target_node_id) REFERENCES roadmap_nodes (id) ON DELETE CASCADE
);
