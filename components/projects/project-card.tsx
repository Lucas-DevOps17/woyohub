import React from "react";
import { ExternalLink, GitBranch } from "lucide-react";

export type ProjectDisplay = {
  id: string;
  title: string;
  description: string;
  deploymentUrl: string;
  status: "Ready" | "Building" | "Error";
  lastUpdated: string; // ISO date
  userAvatarUrl: string;
  userName: string;
  sourceBranch: string;
  latestCommitMessage: string;
  skills: string[];
};

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export function ProjectCard({ project }: { project: ProjectDisplay }) {
  const statusColors = {
    Ready: "var(--primary, #006631)", // Using primary/success color
    Building: "var(--tertiary, #0049DB)",
    Error: "var(--error, #D93434)",
  };

  return (
    <div
      className="rounded-3xl p-5 lg:p-7 transition-all duration-300 hover:scale-[1.02] flex flex-col group relative"
      style={{
        background: "var(--surface-card)",
        boxShadow: "0 8px 28px rgba(0,73,219,0.06)",
      }}
    >
      {/* Header */}
      <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] mb-2">
        {project.title}
      </h3>
      <p className="text-sm leading-relaxed mb-6 flex-grow" style={{ color: "var(--on-surface-variant)" }}>
        {project.description}
      </p>

      {/* Deployment Preview Block */}
      <div className="rounded-2xl p-4 flex flex-col gap-4 text-sm" style={{ background: "var(--surface-low)" }}>
        {/* URL Row */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--outline)" }}>
            Deployment
          </span>
          <a
            href={`https://${project.deploymentUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium hover:underline w-fit"
            style={{ color: "var(--on-surface)" }}
          >
            {project.deploymentUrl}
            <ExternalLink size={14} style={{ color: "var(--outline)" }} />
          </a>
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold" style={{ color: "var(--on-surface)" }}>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: statusColors[project.status] }}
            />
            {project.status}
          </div>
          <div className="flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
            <span>{timeAgo(project.lastUpdated)} by</span>
            <div className="relative group/avatar cursor-help">
              <img
                src={project.userAvatarUrl}
                alt={project.userName}
                className="w-5 h-5 rounded-full object-cover border"
                style={{ borderColor: "var(--surface-high)" }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all whitespace-nowrap z-10" style={{ background: "var(--on-surface)", color: "var(--surface)" }}>
                {project.userName}
              </div>
            </div>
          </div>
        </div>

        {/* Source Row */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider block mb-1 mt-1" style={{ color: "var(--outline)" }}>
            Source
          </span>
          <div className="flex items-center gap-2">
             <GitBranch size={14} style={{ color: "var(--outline)" }} />
             <span className="font-medium" style={{ color: "var(--on-surface)" }}>{project.sourceBranch}</span>
             <span className="truncate flex-1 max-w-[200px]" style={{ color: "var(--on-surface-variant)" }}>
               — {project.latestCommitMessage}
             </span>
          </div>
        </div>
      </div>

      {/* Tags / Skills */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-5">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "var(--outline)",
                color: "var(--outline)",
                background: "transparent",
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
