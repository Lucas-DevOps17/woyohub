import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";

export default async function CoursesPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, skill:skills(name, icon)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  const activeCourses = (courses || []).filter((c) => c.status === "active");
  const completedCourses = (courses || []).filter(
    (c) => c.status === "completed"
  );
  const otherCourses = (courses || []).filter(
    (c) => c.status !== "active" && c.status !== "completed"
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Courses</h1>
          <p className="text-surface-500 mt-1">
            Track your learning across platforms
          </p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add course
        </Link>
      </div>

      {(!courses || courses.length === 0) && (
        <div className="text-center py-16 bg-white border border-surface-200 rounded-xl">
          <span className="text-4xl">📚</span>
          <h3 className="mt-4 text-lg font-semibold text-surface-900">
            No courses yet
          </h3>
          <p className="mt-1 text-sm text-surface-500 max-w-sm mx-auto">
            Start tracking your learning by adding a course from any platform.
          </p>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first course
          </Link>
        </div>
      )}

      {activeCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-surface-900 mb-3">
            Active ({activeCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {completedCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-surface-900 mb-3">
            Completed ({completedCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {otherCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-surface-900 mb-3">
            Paused / Dropped ({otherCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
