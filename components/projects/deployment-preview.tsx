import React from "react";
import { ExternalLink, GitBranch } from "lucide-react";

export type DeploymentPreviewProps = {
  deploymentUrl: string;
  status: "Ready" | "Building" | "Error";
  lastUpdated: string; // ISO date
  userAvatarUrl: string;
  userName: string;
  sourceBranch: string;
  latestCommitMessage: string;
};

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export function DeploymentPreview({ data }: { data: DeploymentPreviewProps }) {
  const statusColors = {
    Ready: "var(--primary, #006631)",
    Building: "var(--tertiary, #0049DB)",
    Error: "var(--error, #D93434)",
  };

  return (
    <div 
      className="rounded-2xl p-5 lg:p-6 flex flex-col gap-5 text-sm" 
      style={{ 
        background: "var(--surface-card, #ffffff)", 
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 4px 20px rgba(0,73,219,0.02)"
      }}
    >
      {/* URL Row */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--outline)" }}>
          Deployment
        </span>
        <a
          href={`https://${data.deploymentUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-medium hover:underline w-fit text-base"
          style={{ color: "var(--on-surface)" }}
        >
          {data.deploymentUrl}
          <ExternalLink size={16} style={{ color: "var(--outline)" }} />
        </a>
      </div>

      {/* Status Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold" style={{ color: "var(--on-surface)" }}>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: statusColors[data.status] }}
          />
          {data.status}
        </div>
        <div className="w-[1px] h-4 bg-black/10"></div>
        <div className="flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
          <span>{timeAgo(data.lastUpdated)} by</span>
          <div className="relative group/avatar cursor-help">
            <img
              src={data.userAvatarUrl}
              alt={data.userName}
              className="w-5 h-5 rounded-full object-cover border"
              style={{ borderColor: "var(--surface-high)" }}
            />
            {/* Tooltip */}
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-xs font-semibold rounded opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all whitespace-nowrap z-10" 
              style={{ background: "var(--on-surface)", color: "var(--surface)" }}
            >
              {data.userName}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-black/5" />

      {/* Source Row */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--outline)" }}>
          Source
        </span>
        <div className="flex items-center gap-2">
           <GitBranch size={16} style={{ color: "var(--outline)" }} />
           <span className="font-semibold" style={{ color: "var(--on-surface)" }}>{data.sourceBranch}</span>
           <span className="truncate flex-1" style={{ color: "var(--on-surface-variant)" }}>
             — {data.latestCommitMessage}
           </span>
        </div>
      </div>
    </div>
  );
}
