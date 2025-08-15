import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import VideoGenerationStatus from "./VideoGenerationStatus";
import VideoActionButtons from "./VideoActionButtons";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoStatusDisplayProps {
  status: string;
  statusInfo: {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  videoUrl: string | null;
  onDownload: (url: string) => void;
  canDownload: boolean;
  errorMessage?: string;
  createdAt?: string;
  estimatedTime?: number;
  modelName?: string;
  imageUrl?: string;
  // New props for edit/regenerate functionality
  generation?: VideoGenerationResult;
  onEdit?: (generation: VideoGenerationResult) => void;
  onRegenerate?: (generation: VideoGenerationResult) => void;
  canEdit?: boolean;
}

const VideoStatusDisplay: React.FC<VideoStatusDisplayProps> = React.memo(({
  status,
  statusInfo,
  videoUrl,
  onDownload,
  canDownload,
  errorMessage,
  createdAt,
  estimatedTime,
  modelName,
  imageUrl,
  generation,
  onEdit,
  onRegenerate,
  canEdit = false
}) => {
  const isCompleted = status === "COMPLETED" || status === "SAVED_TO_R2";
  const isFailed = status === "FAILED";
  const isProcessing = ["submitted", "PROMPT_OPTIMIZING", "IN_QUEUE", "IN_PROGRESS"].includes(status);

  return (
    <>
      {/* Video display area */}
      <div className="w-full mt-4">
        {isCompleted && videoUrl ? (
          <>
            <div className="inline-block group">
              <VideoPlayer 
                videoUrl={videoUrl} 
                onDownload={onDownload} 
                canDownload={canDownload} 
              />
            </div>
            {/* Action buttons for completed videos */}
            {canEdit && generation && onEdit && onRegenerate && (
              <VideoActionButtons
                generation={generation}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
                canEdit={canDownload} // Use canDownload as indicator for non-example videos
              />
            )}
          </>
        ) : (isProcessing || isFailed) && createdAt ? (
          <VideoGenerationStatus
            status={status}
            createdAt={createdAt}
            estimatedTime={estimatedTime}
            modelName={modelName}
            backgroundImage={imageUrl}
            errorMessage={errorMessage}
          />
        ) : (
          <div className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 rounded-lg overflow-hidden relative group flex items-center justify-center bg-gray-700">
            <div className="w-full h-full flex flex-col items-center justify-center">
              {statusInfo.icon && React.createElement(statusInfo.icon, {
                className: cn(
                  "h-8 w-8 text-gray-400 mb-2",
                  statusInfo.icon === Loader2 && "animate-spin"
                )
              })}
              <span className="text-xs text-gray-500 text-center px-2">
                {statusInfo.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

VideoStatusDisplay.displayName = "VideoStatusDisplay";

export default VideoStatusDisplay;