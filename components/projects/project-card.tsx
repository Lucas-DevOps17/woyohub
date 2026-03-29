import React from "react";
import { ExternalLink, Code2, PenTool } from "lucide-react";

export type ProjectDisplay = {
  id: string;
  title: string;
  description: string;
  deploymentUrl: string | null;
  githubUrl: string | null;
  status: "Planned" | "In Progress" | "Completed";
  imageUrl: string | null;
  avatars: string[];
  skills: string[];
};

export function ProjectCard({ project }: { project: ProjectDisplay }) {
  const statusConfig = {
    "Completed": { text: "var(--primary, #006631)", dot: "var(--primary, #006631)", label: "COMPLETED" },
    "In Progress": { text: "#b87504", dot: "#eab308", label: "IN PROGRESS" },
    "Planned": { text: "var(--tertiary, #0049DB)", dot: "var(--tertiary, #0049DB)", label: "PLANNED" },
  };

  const st = statusConfig[project.status] || statusConfig["Planned"];

  return (
    <div
      className="rounded-[28px] overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative group h-full"
      style={{
        background: "var(--surface-card, #f8f9fc)", // very light tint
        boxShadow: "0 12px 32px rgba(0, 73, 219, 0.04)",
        border: "1px solid rgba(0,0,0,0.03)"
      }}
    >
      {/* Hero Image Area */}
      <div className="h-[220px] w-full relative shrink-0" style={{ background: "var(--surface-low)" }}>
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
             <PenTool size={32} />
          </div>
        )}

        {/* Status Pill overlay */}
        <div 
          className="absolute top-4 left-4 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm font-bold text-[10px] tracking-wider bg-white z-10"
          style={{ color: st.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }}></span>
          {st.label}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 lg:p-7 flex flex-col grow">
        <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] leading-tight mb-3">
          {project.title}
        </h3>
        
        <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--on-surface-variant)" }}>
          {project.description}
        </p>

        {/* Skills */}
        {project.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.skills.map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--primary-dim, #e8f0fe)",
                  color: "var(--primary, #006631)", // Matching standard primary unless explicitly customized to blue
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex-grow"></div>

        {/* Footer Area */}
        <div className="flex items-center justify-between pt-2">
          {/* Avatar Group */}
          <div className="flex items-center">
             {project.avatars.length > 0 ? (
               <div className="flex -space-x-2">
                 {project.avatars.slice(0, 2).map((av, idx) => (
                   <img 
                     key={idx}
                     src={av} 
                     alt="Avatar" 
                     className="w-8 h-8 rounded-full border-2 border-white object-cover"
                     style={{ zIndex: 10 - idx }}
                   />
                 ))}
                 {project.avatars.length > 2 && (
                   <div 
                     className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold z-0"
                     style={{ background: "var(--surface-low)", color: "var(--on-surface-variant)" }}
                   >
                     +{project.avatars.length - 2}
                   </div>
                 )}
               </div>
             ) : (
               <div 
                 className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                 style={{ background: "var(--surface-low)", color: "var(--outline)" }}
               >
                 ?
               </div>
             )}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3">
             {project.status === "Planned" ? (
               <span className="text-[12px] font-bold px-2" style={{ color: "var(--outline)" }}>Drafting</span>
             ) : (
               <>
                 {project.githubUrl && (
                   <a 
                     href={project.githubUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-1.5 rounded hover:bg-black/5 transition-colors"
                     style={{ color: "var(--outline)" }}
                   >
                     <Code2 size={18} />
                   </a>
                 )}
                 {project.deploymentUrl && (
                   <a
                     href={project.deploymentUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                     style={{ background: "var(--primary)", color: "white" }}
                   >
                     <ExternalLink size={14} />
                   </a>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}


