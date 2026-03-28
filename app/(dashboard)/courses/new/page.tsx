"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Platform, Skill } from "@/types";

const PLATFORMS: Platform[] = ["Coursera", "YouTube", "Udemy", "freeCodeCamp", "Codecademy", "Pluralsight", "LinkedIn Learning", "edX", "Khan Academy", "Other"];

function NewCourseForm() {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("YouTube");
  const [url, setUrl] = useState("");
  const [totalUnits, setTotalUnits] = useState(1);
  const [skillId, setSkillId] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("skills").select("*").order("category").then(({ data }) => { if (data) setSkills(data); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in"); setLoading(false); return; }
    const { error: err } = await supabase.from("courses").insert({ user_id: user.id, title, platform, url: url || null, total_units: totalUnits, skill_id: skillId || null });
    if (err) { setError(err.message); setLoading(false); } else { router.push("/courses"); router.refresh(); }
  }

  const inp = "w-full px-5 py-3.5 rounded-[14px] text-[15px] outline-none transition-all";

  return (
    <div className="max-w-lg mx-auto px-4 lg:px-10 py-8 lg:py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/courses" className="p-2 rounded-xl transition-colors" style={{ color: "var(--outline)", background: "var(--surface-low)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>Add a course</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <div className="p-4 rounded-[14px] text-sm font-medium" style={{ color: "var(--error)", background: "#fef2f2" }}>{error}</div>}
        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Course title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. React - The Complete Guide" className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }} />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Course URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }} />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Total units</label>
          <input type="number" value={totalUnits} onChange={e => setTotalUnits(Math.max(1, parseInt(e.target.value) || 1))} min={1} className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }} />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Related skill</label>
          <select value={skillId} onChange={e => setSkillId(e.target.value)} className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}>
            <option value="">None</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.category})</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading || !title} className="w-full py-3.5 rounded-full text-[15px] font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          {loading ? "Adding..." : "Add Course"}
        </button>
      </form>
    </div>
  );
}

export default function NewCoursePage() {
  return <Suspense fallback={<div className="p-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>}><NewCourseForm /></Suspense>;
}
