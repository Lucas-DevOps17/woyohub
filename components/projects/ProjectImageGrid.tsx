"use client";

import { motion } from "framer-motion";
import type { ProjectImage } from "@/types/database";

interface ProjectImageGridProps {
  images: ProjectImage[];
  onImageClick: (index: number) => void;
}

export function ProjectImageGrid({ images, onImageClick }: ProjectImageGridProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 rounded-xl overflow-hidden aspect-[16/6]">
      {images.slice(0, 3).map((img, idx) => (
        <motion.div
          key={img.id}
          whileHover={{ scale: 1.05 }}
          className="relative cursor-pointer overflow-hidden"
          onClick={(e) => { e.stopPropagation(); onImageClick(idx); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.image_url}
            alt="Project snippet"
            className="w-full h-full object-cover"
          />
          {idx === 2 && images.length > 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg">+{images.length - 3}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
