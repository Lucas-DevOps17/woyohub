"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Skill } from "@/types";
import { ProjectImageUploader } from "@/components/projects/ProjectImageUploader";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function NewProjectForm() {
  const [projectId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || ""));
    supabase.from("skills").select("*").order("category").then(({ data }) => {
      if (data) setSkills(data);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    // Insert project
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        id: projectId,
        user_id: user.id,
        title,
        description: description || null,
        status,
        github_url: githubUrl || null,
        demo_url: demoUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Insert project_skills
    if (selectedSkills.length > 0) {
      const { error: skillsError } = await supabase.from("project_skills").insert(
        selectedSkills.map((skillId) => ({
          project_id: project.id,
          skill_id: skillId,
        }))
      );

      if (skillsError) {
        setError(skillsError.message);
        setLoading(false);
        return;
      }
    }

    // Optional Auto Screenshot if demo URL present and no images uploaded
    // To implement "OPTIONAL AUTO SCREENSHOT", check if project_images has entries
    const { count } = await supabase.from("project_images").select("*", { count: "exact" }).eq("project_id", project.id);
    if (count === 0 && demoUrl) {
      const thumUrl = `https://image.thum.io/get/fullpage/${demoUrl}`;
      await supabase.from("project_images").insert({
        project_id: project.id,
        image_url: thumUrl,
        is_cover: true
      });
    }

    const { error: recomputeError } = await supabase.rpc("recompute_user_xp", {
      p_user_id: user.id,
    });

    if (recomputeError) {
      setError(recomputeError.message);
      setLoading(false);
      return;
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
          Add a project
        </h1>
      </div>

      <div className="mb-8">
        <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-3" style={{ color: "var(--outline)" }}>
          Project Images (optional)
        </label>
        {userId && <ProjectImageUploader projectId={projectId} userId={userId} />}
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
            placeholder="e.g. Portfolio Website"
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
            placeholder="What did you build?"
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
            placeholder="https://github.com/..."
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
            placeholder="https://..."
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
                  color: selectedSkills.includes(skill.id)
                    ? "white"
                    : "var(--outline)",
                }}
              >
                {skill.icon} {skill.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !title}
          className="w-full py-3.5 rounded-full text-[15px] font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Adding..." : "Add Project"}
        </button>
      </form>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>}>
      <NewProjectForm />
    </Suspense>
  );
}
