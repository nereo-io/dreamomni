import React from "react";
import { getVideoModel } from "@/config/video-models";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import StatusBadge from "./StatusBadge";
import VideoMetadata from "./VideoMetadata";
import EnhancedPrompt from "./EnhancedPrompt";
import VideoStatusDisplay from "./VideoStatusDisplay";

interface VideoHistoryItemProps {
  generation: VideoGenerationResult;
  statusMap: Record<
    string,
    {
      label: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  >;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onDownload: (generation: VideoGenerationResult) => void;
  isDownloading: boolean;
  isExample?: boolean;
  isClient: boolean;
  // New props for edit/regenerate/delete functionality
  onEdit?: (generation: VideoGenerationResult) => void;
  onRegenerate?: (generation: VideoGenerationResult) => void;
  onDelete?: (generation: VideoGenerationResult) => void;
  canEdit?: boolean;
  isDeleting?: boolean;
}

const VideoHistoryItem: React.FC<VideoHistoryItemProps> = React.memo(
  ({
    generation,
    statusMap,
    isExpanded,
    onToggleExpanded,
    onDownload,
    isDownloading,
    isExample = false,
    isClient,
    onEdit,
    onRegenerate,
    onDelete,
    canEdit = false,
    isDeleting = false,
  }) => {
    // Get video URL from various sources
    const getVideoUrl = (gen: VideoGenerationResult) => {
      return (
        gen.video_url ||
        gen.video_url_r2 ||
        gen.upsample_video_url_veo3 ||
        gen.video_url_veo3 ||
        gen.video_url_sora ||
        gen.video_url_volcano ||
        gen.video_url_fal ||
        null
      );
    };

    const videoUrl = getVideoUrl(generation);
    const status =
      statusMap[generation.status as keyof typeof statusMap] ||
      statusMap.submitted;
    const modelConfig = getVideoModel(generation.model_id);

    // Format timestamp
    const formatTimestamp = () => {
      if (!generation.created_at || !isClient) return null;

      const date = new Date(generation.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    };

    // console.log("Video generation data:", {
    //   id: generation.id,
    //   prompt: generation.prompt,
    //   optimized_prompt: generation.optimized_prompt,
    //   has_optimized: !!generation.optimized_prompt,
    //   is_different: generation.optimized_prompt !== generation.prompt,
    // });

    return (
      <div className="p-5 space-y-4">
        {/* Header: Status + Prompt/Effect Title + Timestamp */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1">
            <StatusBadge status={generation.status} statusMap={statusMap} />
            <p
              className="text-base font-bold text-white leading-relaxed flex-1"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {generation.effect_info ? generation.effect_info.title : generation.prompt}
            </p>
          </div>
          {formatTimestamp() && (
            <span className="text-sm text-gray-400 flex-shrink-0 mt-0.5">
              {formatTimestamp()}
            </span>
          )}
        </div>

        {/* Metadata tags */}
        <VideoMetadata
          aspectRatio={generation.aspect_ratio}
          durationSeconds={generation.duration_seconds}
          hasUpsample={!!generation.upsample_video_url_veo3}
          modelName={generation.effect_info ? undefined : (modelConfig?.displayName || generation.model_id)}
        />

        {/* Enhanced Prompt - Only show for non-effect videos */}
        {!generation.effect_info && (
          <EnhancedPrompt
            originalPrompt={generation.prompt}
            optimizedPrompt={generation.optimized_prompt}
            isExpanded={isExpanded}
            onToggle={onToggleExpanded}
          />
        )}

        {/* Video Status Display */}
        <VideoStatusDisplay
          status={generation.status}
          statusInfo={status}
          videoUrl={videoUrl}
          onDownload={() => onDownload(generation)}
          canDownload={!isExample}
          isDownloading={isDownloading}
          errorMessage={generation.error_message}
          createdAt={generation.created_at}
          estimatedTime={modelConfig?.estimatedGenerationTime}
          modelName={modelConfig?.displayName}
          imageUrl={generation.image_url}
          generation={generation}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          canEdit={canEdit && !isExample}
          isDeleting={isDeleting}
        />
      </div>
    );
  }
);

VideoHistoryItem.displayName = "VideoHistoryItem";

export default VideoHistoryItem;
