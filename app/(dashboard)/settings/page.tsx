"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DarkToggle } from "@/components/ui/theme-provider";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("display_name, email").eq("id", user.id).single();
      if (data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || "");
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inp = "w-full px-5 py-3.5 rounded-[14px] text-[15px] outline-none";

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[640px] mx-auto animate-fade-in">
      <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)] mb-6 lg:mb-8" style={{ letterSpacing: -1 }}>Settings</h1>

      {/* Profile */}
      <div className="rounded-3xl p-6 lg:p-8 mb-5" style={{ background: "var(--surface-card)" }}>
        <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] mb-6">Profile</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Display name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }} />
          </div>
          <div>
            <label className="text-[11px] font-bold tracking-[1.5px] uppercase block mb-2" style={{ color: "var(--outline)" }}>Email</label>
            <input value={email} disabled className={inp} style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none", opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <button onClick={handleSave} disabled={saving} className="self-start px-7 py-3 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-3xl p-6 lg:p-8 mb-5" style={{ background: "var(--surface-card)" }}>
        <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] mb-6">Appearance</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[15px] font-semibold text-[var(--on-surface)]">Dark mode</p>
            <p className="text-[13px] mt-1" style={{ color: "var(--outline)" }}>Switch between light and dark themes</p>
          </div>
          <DarkToggle />
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-3xl p-6 lg:p-8 mb-5" style={{ background: "var(--surface-card)" }}>
        <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] mb-6">Integrations</h3>

        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl" style={{ background: "var(--surface-low)" }}>📅</div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--on-surface)]">Google Calendar</p>
              <p className="text-[13px]" style={{ color: "var(--outline)" }}>Sync study sessions</p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-full text-[13px] font-bold" style={{ border: "1.5px solid var(--outline-variant)", color: "var(--primary)", background: "transparent" }}>Connect</button>
        </div>

        <div className="flex justify-between items-center py-4" style={{ borderTop: "1px solid var(--surface-low)" }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl" style={{ background: "var(--surface-low)" }}>🐙</div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--on-surface)]">GitHub</p>
              <p className="text-[13px]" style={{ color: "var(--outline)" }}>Auto-track projects</p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-full text-[13px] font-bold" style={{ border: "1.5px solid var(--outline-variant)", color: "var(--primary)", background: "transparent" }}>Connect</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="font-display text-xl font-extrabold mb-4" style={{ color: "var(--error)" }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>Permanently delete your account and all data. This cannot be undone.</p>
        <button className="px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: "var(--error)" }}>Delete Account</button>
      </div>
    </div>
  );
}
