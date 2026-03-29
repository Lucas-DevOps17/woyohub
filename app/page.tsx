import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <AppLogo size={48} showWordmark />
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-full text-sm font-bold text-white no-underline btn-primary"
        >
          Log in
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-8"
          style={{ color: "var(--primary)", background: "var(--surface-low)" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--primary)" }} />
          Intellectual Ascent
        </div>

        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05]"
          style={{ color: "var(--on-surface)", letterSpacing: -2 }}
        >
          Your learning
          <br />
          journey, <span style={{ color: "var(--primary)" }}>curated</span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed max-w-xl" style={{ color: "var(--on-surface-variant)" }}>
          Track courses from any platform, build your project portfolio,
          follow career roadmaps, and stay motivated with XP, streaks, and achievements.
        </p>

        <div className="mt-10">
          <Link
            href="/login"
            className="px-8 py-4 rounded-full text-base font-bold text-white no-underline btn-primary shadow-float"
          >
            Start Learning
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
          {[
            { icon: "📚", label: "Course tracking" },
            { icon: "🗺️", label: "Career roadmaps" },
            { icon: "🔨", label: "Project portfolio" },
            { icon: "🔥", label: "XP & streaks" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2.5 p-5 rounded-3xl"
              style={{ background: "var(--surface-card)" }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-sm" style={{ color: "var(--outline)" }}>
        Built with focus · WOYOhub © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
