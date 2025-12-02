import React from "react";
import { Copy, Sparkles, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ImageGenerationResult } from "@/components/blocks/image-history";
import EnhancedPrompt from "./EnhancedPrompt";
import ImageStatusDisplay from "./ImageStatusDisplay";
import ImageMetadata from "@/components/blocks/image-history/ImageMetadata";
import { getImageModel } from "@/config/image-models";

interface ImageHistoryItemProps {
  image: ImageGenerationResult;
  pollingImages: Set<string>;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit?: (image: ImageGenerationResult) => void;
  onRegenerate?: (image: ImageGenerationResult) => void;
  onDelete?: (imageId: string, prompt: string) => void;
  onImageClick?: (imageUrl: string, prompt: string) => void;
  onDownload?: (image: ImageGenerationResult) => void;
  isDownloading?: boolean;
  canEdit?: boolean;
}

const ImageHistoryItem: React.FC<ImageHistoryItemProps> = React.memo(
  ({
    image,
    pollingImages,
    isExpanded,
    onToggleExpanded,
    onEdit,
    onRegenerate,
    onDelete,
    onImageClick,
    onDownload,
    isDownloading = false,
    canEdit = false,
  }) => {
    
    // Get status map for images - 与视频生成保持一致的图标
    const getStatusMap = () => ({
      completed: {
        label: "Completed",
        color: "bg-green-600",
        icon: CheckCircle,
      },
      saved_to_r2: {
        label: "Completed", 
        color: "bg-green-600",
        icon: CheckCircle,
      },
      prompt_optimizing: {
        label: "Optimizing Prompt",
        color: "bg-purple-500",
        icon: Sparkles,
      },
      in_progress: {
        label: "Processing",
        color: "bg-orange-500",
        icon: Loader2,
      },
      in_queue: {
        label: "In Queue",
        color: "bg-yellow-500", 
        icon: Clock,
      },
      pending: {
        label: "Pending",
        color: "bg-gray-500",
        icon: Clock,
      },
      failed: {
        label: "Failed",
        color: "bg-red-500",
        icon: XCircle,
      },
    });

    const statusMap = getStatusMap();
    const status = statusMap[image.status as keyof typeof statusMap] || statusMap.pending;

    // Format timestamp
    const formatTimestamp = () => {
      if (!image.created_at) return null;

      const date = new Date(image.created_at);
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

    // Format model display name
    const formatModelDisplayName = (modelName: string) => {
      switch (modelName) {
        case "google/nano-banana":
          return "Text to Image/nano-banana";
        case "nano-banana-edit":
          return "Image to Image/nano-banana";
        default:
          return modelName;
      }
    };

    // Handle copy prompt
    const handleCopyPrompt = async () => {
      try {
        await navigator.clipboard.writeText(image.prompt);
        toast.success("Prompt copied to clipboard");
      } catch (error) {
        console.error("Failed to copy prompt:", error);
        toast.error("Failed to copy prompt");
      }
    };


    return (
      <div className="p-5 space-y-4">
        {/* Header: Source Image Thumbnail + Prompt + Timestamp */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Source Images Thumbnails (if exist) */}
            {image.input_image_urls && image.input_image_urls.length > 0 && (
              <div className="flex-shrink-0 flex gap-1">
                {image.input_image_urls.map((url, index) => (
                  <div 
                    key={index}
                    className="h-12 w-12 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick?.(url, `Source Image ${index + 1}`)}
                    title={`Click to view source image ${index + 1}`}
                  >
                    <img 
                      src={url} 
                      alt={`Source Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Prompt and Copy Button */}
            <div className="flex items-start gap-2 flex-1">
              <p
                className="text-base font-bold text-white leading-relaxed flex-1"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {image.prompt}
              </p>
              <button
                onClick={handleCopyPrompt}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
                title="Copy prompt"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Timestamp */}
          {formatTimestamp() && (
            <span className="text-sm text-gray-400 flex-shrink-0 mt-0.5">
              {formatTimestamp()}
            </span>
          )}
        </div>

        {/* Metadata tags - aspect ratio, resolution, model name, and Agent badge */}
        <ImageMetadata
          aspectRatio={image.image_size}
          resolution={image.resolution}
          modelName={getImageModel(image.model)?.displayName || image.model}
          isAgentMode={image.is_agent_mode}
          agentImageCount={image.agent_image_count}
        />

        {/* Enhanced Prompt */}
        <EnhancedPrompt
          originalPrompt={image.prompt}
          optimizedPrompt={image.optimized_prompt}
          isExpanded={isExpanded}
          onToggle={onToggleExpanded}
        />

        {/* Image Status Display */}
        <ImageStatusDisplay
          status={image.status}
          statusInfo={status}
          imageUrl={image.image_url_r2 || image.image_url}
          imageUrls={image.image_urls}
          imageUrlsR2={image.image_urls_r2}
          errorMessage={image.error_message}
          createdAt={image.created_at}
          image={image}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          onImageClick={onImageClick}
          onDownload={onDownload}
          isDownloading={isDownloading}
          canEdit={canEdit}
          pollingImages={pollingImages}
        />
      </div>
    );
  }
);

ImageHistoryItem.displayName = "ImageHistoryItem";

export default ImageHistoryItem;
