import React from "react";
import { getVideoModel } from "@/config/video-models";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import VideoMetadata from "./VideoMetadata";
import EnhancedPrompt from "./EnhancedPrompt";
import VideoStatusDisplay from "./VideoStatusDisplay";
import ReferenceImagesThumbnails from "./ReferenceImagesThumbnails";
import ImagePreviewModal from "@/components/blocks/image-history-for-generation/components/ImagePreviewModal";

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
    // State for image preview modal
    const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState<number>(0);

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

    // Get image array (unified handling of single and multiple images)
    const getImageArray = (): string[] => {
      if (generation.image_urls && generation.image_urls.length > 0) {
        return generation.image_urls;
      }
      if (generation.image_url) {
        return [generation.image_url];
      }
      return [];
    };

    const imageArray = getImageArray();
    const hasImages = imageArray.length > 0;

    // Modal navigation functions
    const handlePrevious = () => {
      if (selectedImageIndex > 0) {
        const newIndex = selectedImageIndex - 1;
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(imageArray[newIndex]);
      }
    };

    const handleNext = () => {
      if (selectedImageIndex < imageArray.length - 1) {
        const newIndex = selectedImageIndex + 1;
        setSelectedImageIndex(newIndex);
        setSelectedImageUrl(imageArray[newIndex]);
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
        {/* Header: Status/Images + Prompt/Effect Title + Timestamp */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Show reference images if available, otherwise hide status badge */}
            {hasImages && (
              <ReferenceImagesThumbnails
                images={imageArray}
                onImageClick={(url, index) => {
                  setSelectedImageUrl(url);
                  setSelectedImageIndex(index);
                }}
                maxDisplay={3}
              />
            )}
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

        {/* Image Preview Modal */}
        {selectedImageUrl && (
          <ImagePreviewModal
            isOpen={!!selectedImageUrl}
            onClose={() => {
              setSelectedImageUrl(null);
              setSelectedImageIndex(0);
            }}
            imageUrl={selectedImageUrl}
            prompt={generation.effect_info ? generation.effect_info.title : generation.prompt}
            currentIndex={selectedImageIndex}
            totalImages={imageArray.length}
            hasPrevious={selectedImageIndex > 0}
            hasNext={selectedImageIndex < imageArray.length - 1}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        )}
      </div>
    );
  }
);

VideoHistoryItem.displayName = "VideoHistoryItem";

export default VideoHistoryItem;
