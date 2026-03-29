"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DarkToggle } from "@/components/ui/theme-provider";

type CalendarStatus = {
  connected: boolean;
  googleClientConfigured: boolean;
  connection: {
    email: string | null;
    syncEnabled: boolean;
    updatedAt: string;
    calendarId: string | null;
  } | null;
  upcomingStudySessions: number;
};

type StudySession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: string;
};

export default function SettingsPage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionStartsAt, setSessionStartsAt] = useState("");
  const [sessionEndsAt, setSessionEndsAt] = useState("");
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [{ data: profile }, calendarRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("display_name, email").eq("id", user.id).single(),
      fetch("/api/integrations/google-calendar/status", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/study-sessions", { cache: "no-store" }).then((res) => res.json()),
    ]);

    if (profile) {
      setDisplayName(profile.display_name || "");
      setEmail(profile.email || "");
    }

    setCalendarStatus(calendarRes);
    setSessions(sessionsRes.sessions || []);
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleCreateSession() {
    setSessionSaving(true);
    setSessionError(null);

    const res = await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: sessionTitle,
        starts_at: sessionStartsAt,
        ends_at: sessionEndsAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setSessionError(json.error || "Failed to create study session");
      setSessionSaving(false);
      return;
    }

    setSessionTitle("");
    setSessionStartsAt("");
    setSessionEndsAt("");
    setSessionSaving(false);
    await load();
  }

  const inp = "w-full px-5 py-3.5 rounded-[14px] text-[15px] outline-none";

  return (
    <div className="mx-auto max-w-[720px] animate-fade-in px-4 py-6 lg:px-10 lg:py-9">
      <h1
        className="mb-6 font-display text-2xl font-extrabold text-[var(--on-surface)] lg:mb-8 lg:text-4xl"
        style={{ letterSpacing: -1 }}
      >
        Settings
      </h1>

      <div className="mb-5 rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="mb-6 font-display text-xl font-extrabold text-[var(--on-surface)]">Profile</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inp}
              style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
              Email
            </label>
            <input
              value={email}
              disabled
              className={inp}
              style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none", opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary self-start rounded-full px-7 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="mb-6 font-display text-xl font-extrabold text-[var(--on-surface)]">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[var(--on-surface)]">Dark mode</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--outline)" }}>
              Switch between light and dark themes
            </p>
          </div>
          <DarkToggle />
        </div>
      </div>

      <div className="mb-5 rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="mb-6 font-display text-xl font-extrabold text-[var(--on-surface)]">Google Calendar</h3>
        <div className="rounded-2xl p-4" style={{ background: "var(--surface-low)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold text-[var(--on-surface)]">
                {calendarStatus?.connected ? "Connected" : "Not connected yet"}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--outline)" }}>
                {calendarStatus?.connected
                  ? `Calendar account: ${calendarStatus.connection?.email || "Connected account"}`
                  : "Study-session sync foundation is ready. Connect flow can be enabled as soon as Google OAuth credentials are configured."}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[1.2px]"
              style={{
                background: calendarStatus?.connected ? "rgba(0,102,49,0.14)" : "rgba(0,73,219,0.10)",
                color: calendarStatus?.connected ? "var(--tertiary)" : "var(--primary)",
              }}
            >
              {calendarStatus?.connected ? "Ready" : "Setup"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: "var(--surface-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--outline)" }}>
                OAuth status
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--on-surface)]">
                {calendarStatus?.googleClientConfigured ? "Credentials configured" : "Credentials missing"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--surface-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--outline)" }}>
                Scheduled sessions
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--on-surface)]">
                {calendarStatus?.upcomingStudySessions ?? 0} queued for sync
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="mb-6 font-display text-xl font-extrabold text-[var(--on-surface)]">Study Sessions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session title"
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
          <input
            type="datetime-local"
            value={sessionStartsAt}
            onChange={(e) => setSessionStartsAt(e.target.value)}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
          <input
            type="datetime-local"
            value={sessionEndsAt}
            onChange={(e) => setSessionEndsAt(e.target.value)}
            className={inp}
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
          />
          <button
            onClick={handleCreateSession}
            disabled={sessionSaving || !sessionTitle || !sessionStartsAt || !sessionEndsAt}
            className="btn-primary rounded-full px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sessionSaving ? "Scheduling..." : "Add study session"}
          </button>
        </div>
        {sessionError ? (
          <p className="mt-3 text-sm" style={{ color: "var(--error)" }}>
            {sessionError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-1 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "var(--surface-low)" }}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--on-surface)]">{session.title}</p>
                  <p className="text-[13px]" style={{ color: "var(--outline)" }}>
                    {new Date(session.starts_at).toLocaleString()} to {new Date(session.ends_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className="self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[1.2px] sm:self-center"
                  style={{
                    background: session.status === "scheduled" ? "rgba(0,73,219,0.10)" : "rgba(0,102,49,0.14)",
                    color: session.status === "scheduled" ? "var(--primary)" : "var(--tertiary)",
                  }}
                >
                  {session.status}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl p-4 text-sm" style={{ background: "var(--surface-low)", color: "var(--outline)" }}>
              No study sessions yet. Add one here and it will stay scoped to your account only.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl p-6 lg:p-8" style={{ background: "var(--surface-card)" }}>
        <h3 className="mb-4 font-display text-xl font-extrabold" style={{ color: "var(--error)" }}>
          Danger Zone
        </h3>
        <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <button className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: "var(--error)" }}>
          Delete Account
        </button>
      </div>
    </div>
  );
}
