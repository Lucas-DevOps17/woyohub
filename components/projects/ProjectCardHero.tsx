"use client";

import { motion } from "framer-motion";
import { Edit, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import type { Project, ProjectImage } from "@/types/database";

// Define an extended type representing the populated Project query
export type PopulatedProject = Project & {
  project_skills?: Array<{ skill?: { name: string; id: string; icon?: string | null } }>;
};

interface ProjectCardHeroProps {
  project: PopulatedProject;
  onEdit: () => void;
  onDelete: () => void;
  onGalleryOpen: (images: ProjectImage[], index: number) => void;
}

export function ProjectCardHero({ project, onEdit, onDelete, onGalleryOpen }: ProjectCardHeroProps) {
  // Extract images
  const images = project.project_images || [];
  const coverImage = images.find((i) => i.is_cover) || images[0] || null;

  // Extract skills
  const skills = (project.project_skills || [])
    .map((ps) => ps.skill?.name)
    .filter(Boolean) as string[];

  // Define status visuals mapping
  const statusMappings: Record<string, { label: string; bg: string; color: string; indicator: string }> = {
    "completed": { label: "Completed", bg: "var(--tertiary-container, #e6f7ee)", color: "var(--tertiary)", indicator: "bg-[var(--tertiary)]" },
    "in-progress": { label: "In Progress", bg: "var(--primary-dim, #e8f0fe)", color: "var(--primary)", indicator: "bg-[var(--primary)]" },
    "planned": { label: "Planned", bg: "var(--surface-low)", color: "var(--outline)", indicator: "bg-[var(--outline)]" },
  };
  const st = statusMappings[project.status] || statusMappings["planned"];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative rounded-[24px] overflow-hidden flex flex-col h-full hover:z-10 bg-[var(--surface-container)]"
      style={{
        boxShadow: "0 20px 40px rgba(0, 73, 219, 0.06)",
        // using tonal surface fallbacks per DESIGN.md
      }}
    >
      {/* Cover Image Section */}
      <div 
        className="relative w-full aspect-video overflow-hidden cursor-pointer bg-[var(--surface-container-low)]"
        onClick={() => {
          if (images.length > 0) {
            onGalleryOpen(images, images.indexOf(coverImage as any) >= 0 ? images.indexOf(coverImage as any) : 0);
          }
        }}
      >
        {coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              src={coverImage.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            {/* Bottom Gradient Overlay for readability if we put text here, though per instructions, we mainly want overlay on images */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-container)] via-transparent to-transparent pointer-events-none opacity-80" />
            
            {/* Gallery Indicator */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-[8px] flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon size={12} />
                +{images.length - 1}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#f3f2ff] to-[#e6e4fb] flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 mx-auto text-[var(--outline)] opacity-40 mb-2" />
              <p className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">Add Showcase Images</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 lg:p-7 flex flex-col grow relative z-10 bg-[var(--surface-container)]">
        {/* Status & Title */}
        <div className="flex justify-between items-start mb-3 gap-3">
          <h3 className="font-display text-xl lg:text-2xl font-bold text-[var(--on-surface)] line-clamp-2">
            {project.title}
          </h3>
          <span
            className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1.5"
            style={{ background: st.bg, color: st.color }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${st.indicator}`} />
            {st.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-[var(--on-surface-variant)] mb-5 line-clamp-3 overflow-hidden grow">
          {project.description || "No description provided."}
        </p>

        {/* Action Row & XP */}
        <div className="flex justify-between items-center mb-5">
          {project.status === "completed" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold px-2 py-1 rounded-[8px] bg-[var(--tertiary-container)] text-[var(--tertiary)] flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current" />
                100 XP
              </span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto mb-5">
            {skills.map((s) => (
              <span
                key={s}
                className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-[8px]"
                style={{ background: "var(--surface-container-low)", color: "var(--outline)" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-[var(--outline)]/10">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-[12px] bg-[var(--primary)] text-white text-sm font-bold transition-transform active:scale-95"
            >
              Live <ExternalLink size={14} />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-[12px] text-[var(--on-surface)] text-sm font-bold transition-transform active:scale-95"
              style={{ background: "var(--surface-container-low)" }}
            >
              GitHub <ExternalLink size={14} />
            </a>
          )}
          
          <div className="flex gap-1 ml-auto">
            <Link
              href={`/projects/edit/${project.id}`}
              className="p-2.5 rounded-[12px] text-[var(--outline)] transition-colors hover:bg-[var(--surface-container-low)] hover:text-[var(--primary)]"
            >
              <Edit size={16} />
            </Link>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-[12px] text-[var(--outline)] transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}
