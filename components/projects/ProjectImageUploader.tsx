"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, Star, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectImage {
  id: string;
  image_url: string;
  is_cover: boolean;
}

interface ProjectImageUploaderProps {
  projectId: string;
  userId: string;
}

export function ProjectImageUploader({ projectId, userId }: ProjectImageUploaderProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Load existing images
  useEffect(() => {
    async function loadImages() {
      const { data, error } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (data && !error) {
        setImages(data);
      }
    }
    loadImages();
  }, [projectId, supabase]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  }

  async function uploadFiles(files: File[]) {
    setIsUploading(true);
    setError(null);
    try {
      const newImages: ProjectImage[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        // If it's the first image ever, make it cover
        formData.append("isCover", String(images.length === 0 && newImages.length === 0));

        const res = await fetch(`/api/projects/${projectId}/images`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to upload image");
        }
        const { image } = await res.json();
        newImages.push(image);
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    // Optimistic UI
    const previous = [...images];
    setImages(images.filter(i => i.id !== imageId));
    try {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete image");
      }
    } catch (err) {
      setImages(previous);
      console.error(err);
    }
  }

  async function handleSetCover(imageId: string) {
    const updated = images.map(img => ({ ...img, is_cover: img.id === imageId }));
    setImages(updated);
    
    // Server logic: The easiest way without another endpoint is directly updating via supabase
    try {
      await supabase.from("project_images").update({ is_cover: false }).eq("project_id", projectId);
      await supabase.from("project_images").update({ is_cover: true }).eq("id", imageId);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      {/* Upload Area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#e0ddfc] rounded-[24px] cursor-pointer hover:bg-[#f3f2ff] transition-colors"
        style={{ minHeight: "160px" }}
      >
        <UploadCloud className="w-8 h-8 text-[var(--outline)] mb-3" />
        <p className="text-sm font-semibold text-[var(--on-surface)]">
          Click or drag images to upload
        </p>
        <p className="text-[11px] text-[var(--outline)] uppercase tracking-wider mt-1">
          Max 3MB per file
        </p>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {images.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-video rounded-xl overflow-hidden group shadow-sm"
              style={{ background: "var(--surface-low)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img.image_url} 
                alt="Project upload" 
                className="object-cover w-full h-full"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetCover(img.id); }}
                    className={`text-xs font-semibold px-2 py-1 flex items-center gap-1 rounded ${img.is_cover ? 'bg-[var(--primary)] text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/40'}`}
                  >
                    <Star size={12} className={img.is_cover ? "fill-white" : ""} />
                    {img.is_cover ? "Cover" : "Set Cover"}
                  </button>
                </div>
              </div>

              {img.is_cover && (
                <div className="absolute top-2 left-2 z-10 bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Cover
                </div>
              )}
            </motion.div>
          ))}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-video rounded-xl bg-[#f3f2ff] overflow-hidden flex items-center justify-center"
            >
               <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
