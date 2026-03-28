"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Circle, PlayCircle } from "lucide-react";
import { GradBar } from "@/components/ui/grad-bar";
import { getProgressPercentage } from "@/lib/utils";

type Lesson = {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
};

type Course = {
  id: string;
  title: string;
  platform: string;
  url: string | null;
  total_units: number;
  completed_units: number;
  skill_id: string | null;
  skill?: { name: string; icon: string };
};

function CourseDetailContent() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      supabase
        .from("courses")
        .select("*, skill:skills(name, icon)")
        .eq("id", params.id)
        .single(),
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", params.id)
        .order("order_index"),
    ]).then(([courseRes, lessonsRes]) => {
      if (courseRes.data) setCourse(courseRes.data);
      if (lessonsRes.data) setLessons(lessonsRes.data);
      setLoading(false);
    });
  }, [params.id]);

  async function markLessonComplete(lessonId: string) {
    if (!course) return;

    setCompletingLessonId(lessonId);
    setError(null);

    const response = await fetch("/api/lessons/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        courseId: course.id,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Update local state
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId
            ? { ...l, completed: true, completed_at: new Date().toISOString() }
            : l
        )
      );
      setCourse((prev) =>
        prev
          ? { ...prev, completed_units: (prev.completed_units || 0) + 1 }
          : prev
      );
    } else {
      setError(result.error || "Failed to mark lesson complete");
    }

    setCompletingLessonId(null);
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--outline)" }}>
        Loading...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-4 lg:px-10 py-8 lg:py-12 max-w-lg mx-auto animate-fade-in">
        <div className="rounded-3xl p-16 text-center" style={{ background: "var(--surface-card)" }}>
          <p className="text-5xl mb-4">📚</p>
          <h3 className="font-display text-xl font-bold text-[var(--on-surface)]">Course not found</h3>
          <Link href="/courses" className="inline-block mt-6 px-7 py-3 rounded-full text-sm font-bold text-white btn-primary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage(course.completed_units, course.total_units);
  const isComplete = progress === 100;

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[900px] mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/courses"
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--outline)", background: "var(--surface-low)" }}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>
          {course.title}
        </h1>
      </div>

      {/* Course Header */}
      <div className="rounded-3xl overflow-hidden mb-6" style={{ background: "var(--surface-card)" }}>
        <div className="card-dark-gradient h-[140px] lg:h-[180px] relative flex items-end p-4">
          <span className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide" style={{ background: "var(--primary)" }}>
            {course.platform?.toUpperCase()}
          </span>
        </div>
        <div className="p-5 lg:p-7">
          <div className="flex justify-between items-start mb-3 gap-3">
            <div>
              <h2 className="font-display text-xl lg:text-2xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.3 }}>
                {course.skill?.icon || "📖"} {course.skill?.name || "General"}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
                {course.completed_units} of {course.total_units} units completed
              </p>
            </div>
            {isComplete && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0" style={{ color: "#62ff96", background: "rgba(0,102,49,0.3)" }}>
                COMPLETED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex-1">
              <GradBar pct={progress} h={8} variant={isComplete ? "tertiary" : "primary"} />
            </div>
            <span className="text-[13px] font-semibold" style={{ color: isComplete ? "var(--tertiary)" : "var(--outline)" }}>
              {progress}%
            </span>
          </div>
          {course.url && (
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              Open Course
            </a>
          )}
        </div>
      </div>

      {/* Lessons List */}
      <div className="rounded-3xl p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
        <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] mb-4" style={{ letterSpacing: -0.5 }}>
          Lessons
        </h3>

        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm" style={{ color: "var(--outline)" }}>
              No lessons added yet. Add lessons to track your progress.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{
                  background: lesson.completed ? "var(--tertiary-container, #e6f7ee)" : "var(--surface-low)",
                }}
              >
                <div className="flex-shrink-0">
                  {lesson.completed ? (
                    <CheckCircle size={24} className="text-[var(--tertiary)]" />
                  ) : (
                    <PlayCircle size={24} className="text-[var(--outline)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-semibold text-[var(--on-surface)] truncate"
                    style={{
                      textDecoration: lesson.completed ? "line-through" : "none",
                      opacity: lesson.completed ? 0.6 : 1,
                    }}
                  >
                    {lesson.title}
                  </p>
                  {lesson.completed_at && (
                    <p className="text-xs" style={{ color: "var(--outline)" }}>
                      Completed {new Date(lesson.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!lesson.completed && (
                  <button
                    onClick={() => markLessonComplete(lesson.id)}
                    disabled={!!completingLessonId}
                    className="px-4 py-2 rounded-full text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "var(--primary)" }}
                  >
                    {completingLessonId === lesson.id ? "..." : "Mark Complete"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl text-sm font-medium" style={{ color: "var(--error)", background: "#fef2f2" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>}>
      <CourseDetailContent />
    </Suspense>
  );
}
