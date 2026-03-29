"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel, type UserProfile } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectCardHero, type PopulatedProject } from "@/components/projects/ProjectCardHero";
import { ProjectGalleryModal } from "@/components/projects/ProjectGalleryModal";
import type { ProjectImage } from "@/types/database";

export default function ProjectsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<PopulatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;

    const profileResult = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const projectsResult = await supabase
      .from("projects")
      .select("*, project_skills(skill:skills(name, id, icon)), project_images(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setProfile(profileResult.data);
    setProjects((projectsResult.data || []) as PopulatedProject[]);
    setLoading(false);
  }

  async function deleteProject(projectId: string) {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetch("/api/projects/" + projectId, { method: "DELETE" });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert("Failed to delete project");
    }
  }

  function handleEditProject(projectId: string) {
    router.push("/projects/edit/" + projectId);
  }

  function handleGalleryOpen(images: ProjectImage[], index: number) {
    setGalleryImages(images);
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  }

  const level = calculateLevel(profile?.total_xp || 0);

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--outline)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <TopBar
        displayName={profile?.display_name || "Learner"}
        level={level}
        streak={profile?.current_streak || 0}
      />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in relative z-0">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <h1
            className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]"
            style={{ letterSpacing: -1 }}
          >
            Hall of Fame
          </h1>
          <Link
            href="/projects/new"
            className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div
            className="rounded-3xl p-16 text-center"
            style={{ background: "var(--surface-container)" }}
          >
            <p className="text-5xl mb-4">🖼️</p>
            <h3 className="font-display text-xl font-bold text-[var(--on-surface)] mb-2">
              No projects yet
            </h3>
            <p
              className="text-sm mt-2 max-w-sm mx-auto"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Showcase your work and build your Hall of Fame by adding your first project.
            </p>
            <Link
              href="/projects/new"
              className="mt-6 inline-block px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline"
            >
              Add Showcase Images
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {projects.map((p) => (
              <ProjectCardHero
                key={p.id}
                project={p}
                onEdit={() => handleEditProject(p.id)}
                onDelete={() => deleteProject(p.id)}
                onGalleryOpen={handleGalleryOpen}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectGalleryModal
        isOpen={isGalleryOpen}
        images={galleryImages}
        initialIndex={galleryIndex}
        onClose={() => setIsGalleryOpen(false)}
        onIndexChange={setGalleryIndex}
      />
    </div>
  );
}