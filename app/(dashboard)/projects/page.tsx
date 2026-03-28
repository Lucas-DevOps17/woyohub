"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel, type UserProfile } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in-progress" | "completed";
  github_url: string | null;
  demo_url: string | null;
  project_skills?: { skill?: { name: string; id: string } }[];
};

export default function ProjectsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*, project_skills(skill:skills(name, id))")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setProfile(profileData);
    setProjects(projectsData || []);
    setLoading(false);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project?")) return;

    const { error } = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    }).then((r) => r.json());
    if (error) {
      alert(error);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    setOpenMenuId(null);
  }

  const level = calculateLevel(profile?.total_xp || 0);

  const statusColors: Record<string, { bg: string; color: string }> = {
    completed: {
      bg: "var(--tertiary-container, #e6f7ee)",
      color: "var(--tertiary)",
    },
    "in-progress": {
      bg: "var(--primary-dim, #e8f0fe)",
      color: "var(--primary)",
    },
    planned: { bg: "var(--surface-low)", color: "var(--outline)" },
  };

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--outline)" }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <TopBar
        displayName={profile?.display_name || "Learner"}
        level={level}
        streak={profile?.current_streak || 0}
      />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <h1
            className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]"
            style={{ letterSpacing: -1 }}
          >
            Projects
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
            style={{ background: "var(--surface-card)" }}
          >
            <p className="text-5xl mb-4">🔨</p>
            <h3 className="font-display text-xl font-bold text-[var(--on-surface)]">
              No projects yet
            </h3>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Showcase your work by adding your first project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {projects.map((p) => {
              const st = statusColors[p.status] || statusColors.planned;
              const skills = (p.project_skills || [])
                .map((ps) => ps.skill?.name)
                .filter((s): s is string => Boolean(s));
              const skillIds = (p.project_skills || [])
                .map((ps) => ps.skill?.id)
                .filter((s): s is string => Boolean(s));

              return (
                <div
                  key={p.id}
                  className="rounded-3xl overflow-hidden relative"
                  style={{ background: "var(--surface-card)" }}
                >
                  {/* Menu button */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === p.id ? null : p.id)
                      }
                      className="p-2 rounded-full transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "var(--on-surface)",
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === p.id && (
                      <div
                        className="absolute right-0 mt-1 rounded-2xl shadow-lg overflow-hidden z-20"
                        style={{ background: "var(--surface-card)" }}
                      >
                        <Link
                          href={`/projects/edit/${p.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-surface-low"
                          style={{ color: "var(--on-surface)" }}
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium w-full text-left"
                          style={{
                            color: "var(--error)",
                            background: "rgba(217,52,52,0.05)",
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="card-dark-gradient h-[100px] flex items-center justify-center">
                    <span className="text-3xl opacity-30">
                      {p.status === "completed"
                        ? "✓"
                        : p.status === "in-progress"
                        ? "⚙"
                        : "📋"}
                    </span>
                  </div>
                  <div className="p-5 lg:p-7">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)]">
                        {p.title}
                      </h3>
                      <span
                        className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {p.description}
                    </p>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{
                              background: "var(--surface-low)",
                              color: "var(--outline)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {(p.github_url || p.demo_url) && (
                      <div className="flex gap-2 mt-4">
                        {p.github_url && (
                          
                            href={p.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                            style={{
                              background: "var(--surface-low)",
                              color: "var(--on-surface)",
                            }}
                          >
                            GitHub
                          </a>
                        )}
                        {p.demo_url && (
                          
                            href={p.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                            style={{
                              background: "var(--primary)",
                              color: "white",
                            }}
                          >
                            Live Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}