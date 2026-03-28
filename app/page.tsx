import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-semibold text-lg text-surface-900">WOYOhub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-surface-700 hover:text-surface-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          Track · Learn · Level Up
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-surface-900 tracking-tight leading-tight">
          Your learning journey,{" "}
          <span className="text-brand-600">gamified</span>
        </h1>

        <p className="mt-6 text-lg text-surface-500 max-w-xl leading-relaxed">
          Track courses from any platform, build your project portfolio, follow
          career roadmaps, and stay motivated with XP, streaks, and achievements.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="px-6 py-3 text-base font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 text-base font-medium text-surface-700 bg-white hover:bg-surface-100 rounded-xl transition-colors border border-surface-200"
          >
            I have an account
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
          {[
            { icon: "📚", label: "Course tracking" },
            { icon: "🗺️", label: "Career roadmaps" },
            { icon: "🔨", label: "Project portfolio" },
            { icon: "🔥", label: "XP & streaks" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-surface-200 shadow-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-surface-600">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-surface-400">
        Built with focus · WOYOhub © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
