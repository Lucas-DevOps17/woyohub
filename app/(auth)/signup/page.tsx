"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/ui/app-logo";

function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: {
          full_name: displayName.trim() || undefined,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Account created. Check your email to confirm your account, then log in.");
    setLoading(false);
    router.refresh();
  }

  async function handleGoogleSignup() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <AppLogo size={48} />
        </Link>
        <h1 className="mt-4 font-display text-2xl font-extrabold" style={{ color: "var(--on-surface)" }}>
          Create your account
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Start tracking your learning, projects, roadmaps, and study sessions.
        </p>
      </div>

      {error ? (
        <div className="rounded-[14px] p-3 text-sm font-medium" style={{ color: "var(--error)", background: "#fef2f2" }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[14px] p-3 text-sm font-medium" style={{ color: "var(--tertiary)", background: "#ecfdf5" }}>
          {success}
        </div>
      ) : null}

      <button
        onClick={handleGoogleSignup}
        className="flex w-full items-center justify-center gap-3 rounded-[14px] px-4 py-2.5 text-sm font-medium transition-colors"
        style={{ border: "1.5px solid var(--outline-variant)", color: "var(--on-surface)", background: "var(--surface-card)" }}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "1px solid var(--outline-variant)" }} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2" style={{ background: "var(--surface)", color: "var(--outline)" }}>
            or create an account with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: "var(--outline)" }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", border: "none" }}
            placeholder="Repeat your password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-full py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--primary)" }}>
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
