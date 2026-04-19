"use client";

import { useState, useRef } from "react";
import { Film, ImageIcon, X, CheckCircle2, Plus, Library, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { uploadMediaToR2 } from "@/lib/upload-utils";

interface MotionControlUploadProps {
  videoUrl: string | null;
  imageUrl: string | null;
  orientation: "video" | "image";
  onVideoChange: (url: string | null) => void;
  onImageChange: (url: string | null) => void;
  onOrientationChange: (val: "video" | "image") => void;
  onSelectFromCreations: () => void;
  onSelectVideoFromCreations: () => void;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
}

export function MotionControlUpload({
  videoUrl,
  imageUrl,
  orientation,
  onVideoChange,
  onImageChange,
  onOrientationChange,
  onSelectFromCreations,
  onSelectVideoFromCreations,
  isAuthenticated,
  onShowSignModal,
}: MotionControlUploadProps) {
  const t = useTranslations("video-generator");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showTip, setShowTip] = useState(true);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, type: "video" | "image") => {
    if (!isAuthenticated) {
      onShowSignModal();
      return;
    }

    if (type === "video") {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video exceeds 100MB");
        return;
      }
      setIsUploadingVideo(true);
      try {
        const url = await uploadMediaToR2(file);
        onVideoChange(url);
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setIsUploadingVideo(false);
      }
    } else {
      setIsUploadingImage(true);
      try {
        const url = await uploadMediaToR2(file);
        onImageChange(url);
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Video Box */}
        <div
          className={`relative aspect-square flex flex-col border border-gray-800 rounded-xl overflow-hidden bg-[#1a1b1e] transition-all`}
        >
          {/* Media Area */}
          <div
            className="relative flex-1 flex items-center justify-center cursor-pointer bg-gray-900/20 group overflow-hidden"
            onClick={() => !videoUrl && videoInputRef.current?.click()}
          >
            {videoUrl ? (
              <video 
                src={videoUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                autoPlay 
                muted 
                loop 
              />
            ) : isUploadingVideo ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-200 text-center px-2">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium leading-tight">{t("referenceVideo")}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectVideoFromCreations(); }}
                  className="mt-1 text-xs text-gray-500 hover:text-primary underline transition-colors"
                >
                  {t("myCreations")}
                </button>
              </div>
            )}
            
            {videoUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); onVideoChange(null); }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 rounded-full text-white z-20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Orientation Selector Area - Fixed Height */}
          <div 
            className="h-9 flex items-center justify-center gap-2 cursor-pointer transition-all z-10 border-t bg-[#111214] border-gray-800/50 group/bar"
            onClick={(e) => { e.stopPropagation(); onOrientationChange("video"); }}
          >
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
              orientation === "video" ? "border-primary bg-primary/20" : "border-gray-600 group-hover/bar:border-gray-500"
            }`}>
              {orientation === "video" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-sm font-bold whitespace-nowrap transition-colors ${
              orientation === "video" ? "text-gray-200" : "text-gray-500 group-hover/bar:text-gray-400"
            }`}>{t("orientationVideo")}</span>
          </div>
        </div>

        {/* Image Box */}
        <div
          className={`relative aspect-square flex flex-col border border-gray-800 rounded-xl overflow-hidden bg-[#1a1b1e] transition-all`}
        >
          {/* Media Area */}
          <div
            className="relative flex-1 flex items-center justify-center cursor-pointer bg-gray-900/20 group overflow-hidden"
            onClick={() => !imageUrl && imageInputRef.current?.click()}
          >
            {imageUrl ? (
              <img 
                src={imageUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Ref" 
              />
            ) : isUploadingImage ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-200 text-center px-2">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium leading-tight">{t("characterImage")}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectFromCreations(); }}
                  className="mt-1 text-xs text-gray-500 hover:text-primary underline transition-colors"
                >
                  {t("myCreations")}
                </button>
              </div>
            )}
            
            {imageUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); onImageChange(null); }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 rounded-full text-white z-20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Orientation Selector Area - Fixed Height */}
          <div 
            className="h-9 flex items-center justify-center gap-2 cursor-pointer transition-all z-10 border-t bg-[#111214] border-gray-800/50 group/bar"
            onClick={(e) => { e.stopPropagation(); onOrientationChange("image"); }}
          >
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
              orientation === "image" ? "border-primary bg-primary/20" : "border-gray-600 group-hover/bar:border-gray-500"
            }`}>
              {orientation === "image" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-sm font-bold whitespace-nowrap transition-colors ${
              orientation === "image" ? "text-gray-200" : "text-gray-500 group-hover/bar:text-gray-400"
            }`}>{t("orientationImage")}</span>
          </div>
        </div>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/quicktime" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "video")} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "image")} />

      {showTip && (
        <div className="relative bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 pr-7">
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-primary/10 border-l border-t border-primary/20 rotate-45" />
          <p className="text-sm text-gray-400 leading-relaxed">
            {t("motionControlTip")}
          </p>
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-1.5 right-1.5 p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

    </div>
  );
}
