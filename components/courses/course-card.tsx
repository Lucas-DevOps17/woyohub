"use client";

import { getProgressPercentage } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type CourseCardProps = {
  course: {
    id: string;
    title: string;
    platform: string;
    url: string | null;
    total_units: number;
    completed_units: number;
    status: string;
    skill?: { name: string; icon: string | null } | null;
  };
};

export function CourseCard({ course }: CourseCardProps) {
  const progress = getProgressPercentage(
    course.completed_units,
    course.total_units
  );

  const statusColors: Record<string, string> = {
    active: "bg-blue-50 text-blue-700",
    completed: "bg-green-50 text-green-700",
    paused: "bg-amber-50 text-amber-700",
    dropped: "bg-surface-100 text-surface-500",
  };

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-4 hover:border-surface-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-900 truncate">
            {course.title}
          </h3>
          <p className="text-xs text-surface-500 mt-0.5">{course.platform}</p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[course.status] || statusColors.active}`}
          >
            {course.status}
          </span>
          {course.url && (
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {course.skill && (
        <div className="inline-flex items-center gap-1 text-xs text-surface-600 bg-surface-50 px-2 py-1 rounded mb-3">
          {course.skill.icon && <span>{course.skill.icon}</span>}
          {course.skill.name}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-surface-500">
          <span>
            {course.completed_units} / {course.total_units} units
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-surface-100 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
