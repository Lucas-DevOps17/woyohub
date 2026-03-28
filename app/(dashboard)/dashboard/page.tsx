import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateLevel, xpForNextLevel, xpProgressInLevel } from "@/types";
import {
  Flame,
  Zap,
  BookOpen,
  FolderKanban,
  Trophy,
  TrendingUp,
} from "lucide-react";

async function getDashboardData() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, coursesRes, projectsRes, achievementsRes, todayXpRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("courses").select("id, status").eq("user_id", user.id),
      supabase.from("projects").select("id, status").eq("user_id", user.id),
      supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id),
      supabase
        .from("xp_logs")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", new Date().toISOString().split("T")[0]),
    ]);

  const profile = profileRes.data;
  const courses = coursesRes.data || [];
  const projects = projectsRes.data || [];
  const achievements = achievementsRes.data || [];
  const todayXp = (todayXpRes.data || []).reduce(
    (sum, log) => sum + log.amount,
    0
  );

  return {
    profile,
    activeCourses: courses.filter((c) => c.status === "active").length,
    completedCourses: courses.filter((c) => c.status === "completed").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    totalProjects: projects.length,
    achievementCount: achievements.length,
    todayXp,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data || !data.profile) {
    return (
      <div className="text-center py-20 text-surface-500">
        Loading your dashboard...
      </div>
    );
  }

  const { profile } = data;
  const level = calculateLevel(profile.total_xp);
  const nextLevelXp = xpForNextLevel(level);
  const currentProgress = xpProgressInLevel(profile.total_xp);
  const progressPercent = Math.round((currentProgress / 100) * 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Welcome back, {profile.display_name || "Learner"}
        </h1>
        <p className="text-surface-500 mt-1">
          Here&apos;s your learning progress today
        </p>
      </div>

      {/* XP + Level card */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-brand-100 text-sm font-medium">Level {level}</p>
            <p className="text-3xl font-bold mt-1">
              {profile.total_xp.toLocaleString()} XP
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Flame className="w-5 h-5 text-amber-300" />
                <span className="text-2xl font-bold">
                  {profile.current_streak}
                </span>
              </div>
              <p className="text-xs text-brand-200 mt-0.5">day streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-2xl font-bold">{data.todayXp}</span>
              </div>
              <p className="text-xs text-brand-200 mt-0.5">XP today</p>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-brand-200">
            <span>{currentProgress} / 100 XP</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="w-full bg-brand-800/40 rounded-full h-2.5">
            <div
              className="bg-white/90 h-2.5 rounded-full progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Active courses"
          value={data.activeCourses}
          color="blue"
        />
        <StatCard
          icon={Trophy}
          label="Completed"
          value={data.completedCourses}
          color="green"
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={data.totalProjects}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Achievements"
          value={data.achievementCount}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            href="/courses/new"
            label="Add a course"
            description="Track a new course from any platform"
            icon="📚"
          />
          <QuickAction
            href="/projects/new"
            label="Add a project"
            description="Showcase your latest build"
            icon="🔨"
          />
          <QuickAction
            href="/roadmaps"
            label="Browse roadmaps"
            description="Find your next career path"
            icon="🗺️"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-4">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-surface-900 mt-3">{value}</p>
      <p className="text-sm text-surface-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-3 p-4 bg-white border border-surface-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all group"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-medium text-surface-900 group-hover:text-brand-700 transition-colors">
          {label}
        </p>
        <p className="text-xs text-surface-500 mt-0.5">{description}</p>
      </div>
    </a>
  );
}
