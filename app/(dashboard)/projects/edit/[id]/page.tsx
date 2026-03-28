"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Skill } from "@/types";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function EditProjectForm() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("skills").select("*").order("category").then(({ data }) => {
      if (data) setSkills(data);
    });
  }, []);

  useEffect(() => {
    if (params.id) {
      supabase
        .from("projects")
        .select("*, project_skills(skill_id)")
        .eq("id", params.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }
          if (data) {
            setTitle(data.title);
            setDescription(data.description || "");
            setStatus(data.status);
            setGithubUrl(data.github_url || "");
            setDemoUrl(data.demo_url || "");
            setSelectedSkills((data.project_skills || []).map((ps: any) => ps.skill_id));
          }
          setLoading(false);
        });
    }
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error: updateError } = await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        status,
        github_url: githubUrl,
        demo_url: demoUrl,
        skill_ids: selectedSkills,
      }),
    }).then((r) => r.json());

    if (updateError) {
      setError(updateError);
      setSaving(false);
      return;
    }

    // If newly completed, award XP
    if (status === "completed") {
      await fetch("/api/projects/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id }),
      });
    }

    router.push("/projects");
    router.refresh();
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  }

  const inp = "w-full px-5 py-3.5 rounded-[14px] text-[15px] outline-none transition-all";

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--outline)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 lg:px-10 py-8 lg:py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/projects"
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--outline)", background: "var(--surface-low)" }}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>
          Edit project
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="p-4 rounded-[14px] text-sm font-medium" style={{ color: "var(--error)", background: "#fef2f2" }}>
            {error}
          </div>
        )}

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            Project title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none", resize: "vertical" }}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            GitHub URL
          </label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            Demo URL
          </label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>
            Skills used
          </label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: selectedSkills.includes(skill.id)
                    ? "var(--primary)"
                    : "var(--surface-low)",
                  color: selectedSkills.includes(skill.id) ? "white" : "var(--outline)",
                }}
              >
                {skill.icon} {skill.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title}
          className="w-full py-3.5 rounded-full text-[15px] font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>}>
      <EditProjectForm />
    </Suspense>
  );
}
