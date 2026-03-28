"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Platform, Skill } from "@/types";

const PLATFORMS: Platform[] = [
  "Coursera",
  "YouTube",
  "Udemy",
  "freeCodeCamp",
  "Codecademy",
  "Pluralsight",
  "LinkedIn Learning",
  "edX",
  "Khan Academy",
  "Other",
];

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("YouTube");
  const [url, setUrl] = useState("");
  const [totalUnits, setTotalUnits] = useState(1);
  const [skillId, setSkillId] = useState<string>("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSkills() {
      const { data } = await supabase
        .from("skills")
        .select("*")
        .order("category", { ascending: true });
      if (data) setSkills(data);
    }
    loadSkills();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("courses").insert({
      user_id: user.id,
      title,
      platform,
      url: url || null,
      total_units: totalUnits,
      skill_id: skillId || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/courses");
      router.refresh();
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/courses"
          className="p-2 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">Add a course</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Course title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            placeholder="e.g. React - The Complete Guide"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Platform *
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Course URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Total units (lessons / videos) *
          </label>
          <input
            type="number"
            value={totalUnits}
            onChange={(e) => setTotalUnits(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            required
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Related skill
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            <option value="">None</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.icon} {skill.name} ({skill.category})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !title}
          className="w-full py-2.5 px-4 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {loading ? "Adding..." : "Add course"}
        </button>
      </form>
    </div>
  );
}
