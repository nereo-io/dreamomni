"use client";

import { useState, useRef } from "react";
import { Film, ImageIcon, X, CheckCircle2, Plus, Library, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { uploadMediaToR2 } from "@/lib/upload-utils";

// Motion Control API limits (per Kie.ai kling-3.0/motion-control docs):
// - Image: jpg/png, ≤10MB, min 300px both sides, aspect ratio 2:5 to 5:2.
// - Video: mp4/mov, ≤100MB, 3-30s; orientation="image" caps at 10s.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MIN_IMAGE_PIXELS = 300;
const MIN_IMAGE_ASPECT = 2 / 5;
const MAX_IMAGE_ASPECT = 5 / 2;
const MIN_VIDEO_SECONDS = 3;
const MAX_VIDEO_SECONDS = 30;
const MAX_VIDEO_SECONDS_IMAGE_ORIENTATION = 10;

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };
    img.src = url;
  });
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video_metadata_failed"));
    };
    video.src = url;
  });
}

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
  // Cached duration of the currently selected reference video so we can
  // re-validate when the user toggles orientation without re-uploading.
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);

  useEffect(() => {
    if (!videoUrl) setVideoDurationSec(null);
  }, [videoUrl]);

  const handleOrientationChange = (next: "video" | "image") => {
    if (
      next === "image" &&
      videoDurationSec !== null &&
      videoDurationSec > MAX_VIDEO_SECONDS_IMAGE_ORIENTATION
    ) {
      toast.error(
        `"Consistent with Image" requires the reference video ≤ ${MAX_VIDEO_SECONDS_IMAGE_ORIENTATION}s (current: ${videoDurationSec.toFixed(1)}s). Use "Consistent with Video" or upload a shorter clip.`
      );
      return;
    }
    onOrientationChange(next);
  };

  const handleFile = async (file: File, type: "video" | "image") => {
    if (!isAuthenticated) {
      onShowSignModal();
      return;
    }

    if (type === "video") {
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error("Video exceeds 100MB");
        return;
      }

      let duration: number;
      try {
        duration = await readVideoDuration(file);
      } catch {
        toast.error("Could not read video metadata. Try re-encoding the file.");
        return;
      }
      if (!Number.isFinite(duration) || duration <= 0) {
        toast.error("Could not determine video duration.");
        return;
      }
      if (duration < MIN_VIDEO_SECONDS || duration > MAX_VIDEO_SECONDS) {
        toast.error(
          `Video duration must be between ${MIN_VIDEO_SECONDS}s and ${MAX_VIDEO_SECONDS}s (got ${duration.toFixed(1)}s)`
        );
        return;
      }
      if (
        orientation === "image" &&
        duration > MAX_VIDEO_SECONDS_IMAGE_ORIENTATION
      ) {
        toast.error(
          `"Consistent with Image" caps at ${MAX_VIDEO_SECONDS_IMAGE_ORIENTATION}s (got ${duration.toFixed(1)}s). Switch to "Consistent with Video" or upload a shorter clip.`
        );
        return;
      }

      setIsUploadingVideo(true);
      try {
        const url = await uploadMediaToR2(file);
        setVideoDurationSec(duration);
        onVideoChange(url);
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setIsUploadingVideo(false);
      }
    } else {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error("Image exceeds 10MB");
        return;
      }

      let dims: { width: number; height: number };
      try {
        dims = await readImageDimensions(file);
      } catch {
        toast.error("Could not read image. Try a different file.");
        return;
      }
      if (dims.width < MIN_IMAGE_PIXELS || dims.height < MIN_IMAGE_PIXELS) {
        toast.error(
          `Image must be at least ${MIN_IMAGE_PIXELS}px on each side (got ${dims.width}×${dims.height})`
        );
        return;
      }
      const aspect = dims.width / dims.height;
      if (aspect < MIN_IMAGE_ASPECT || aspect > MAX_IMAGE_ASPECT) {
        toast.error(
          `Image aspect ratio must be between 2:5 and 5:2 (got ${dims.width}:${dims.height})`
        );
        return;
      }

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

          {/* Orientation Selector Area - hidden; default orientation="video" always applies */}
          <div
            className="hidden h-9 items-center justify-center gap-2 cursor-pointer transition-all z-10 border-t bg-[#111214] border-gray-800/50 group/bar"
            onClick={(e) => { e.stopPropagation(); handleOrientationChange("video"); }}
          >
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
              orientation === "video" ? "border-primary bg-primary/20" : "border-gray-600 group-hover/bar:border-gray-500"
            }`}>
              {orientation === "video" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
              orientation === "video" ? "text-gray-200" : "text-gray-500 group-hover/bar:text-gray-400"
            }`}>{t("orientationVideo")}</span>
          </div>
        </div>

        {/* Image Box */}
        <div
          className={`relative aspect-square flex flex-col border border-gray-800 rounded-xl overflow-hidden bg-[#1a1b1e] transition-all`}
        >
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

          {/* Orientation Selector Area - hidden; default orientation="video" always applies */}
          <div
            className="hidden h-9 items-center justify-center gap-2 cursor-pointer transition-all z-10 border-t bg-[#111214] border-gray-800/50 group/bar"
            onClick={(e) => { e.stopPropagation(); handleOrientationChange("image"); }}
          >
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
              orientation === "image" ? "border-primary bg-primary/20" : "border-gray-600 group-hover/bar:border-gray-500"
            }`}>
              {orientation === "image" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
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
