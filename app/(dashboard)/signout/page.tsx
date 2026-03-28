"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 animate-fade-in">
      <div className="rounded-3xl p-10 text-center max-w-[400px] w-full" style={{ background: "var(--surface-card)" }}>
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-5 text-3xl" style={{ background: "#fef2f2" }}>
          👋
        </div>
        <h2 className="font-display text-2xl font-extrabold text-[var(--on-surface)] mb-2">Sign out?</h2>
        <p className="text-[15px] leading-relaxed mb-7" style={{ color: "var(--on-surface-variant)" }}>
          Come back tomorrow to keep your streak going!
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignOut}
            className="w-full py-3.5 rounded-full text-[15px] font-bold text-white"
            style={{ background: "var(--error)" }}
          >
            Sign Out
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 rounded-full text-[15px] font-bold"
            style={{ border: "1.5px solid var(--outline-variant)", color: "var(--primary)", background: "transparent" }}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
