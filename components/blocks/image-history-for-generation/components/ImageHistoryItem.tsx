import React, { useState } from "react";
import { Copy, Sparkles, Loader2, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ImageGenerationResult } from "@/components/blocks/image-history";
import EnhancedPrompt from "./EnhancedPrompt";
import ImageStatusDisplay from "./ImageStatusDisplay";
import ImageMetadata from "@/components/blocks/image-history/ImageMetadata";
import { getImageModel } from "@/config/image-models";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

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
    const hasEffectInfo = !!(image.effect_type && image.effect_id && image.effect_name);
    const deleteLabel = hasEffectInfo ? image.effect_name! : image.prompt;
    const displayPrompt = hasEffectInfo
      ? image.effect_name || image.prompt
      : image.prompt;

    // Delete state
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    // Handle delete click
    const handleDeleteClick = async (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!onDelete || isDeleting) return;

      setShowDeleteDialog(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
      if (!onDelete) return;

      setIsDeleting(true);
      setShowDeleteDialog(false);

      try {
        await onDelete(image.id, deleteLabel || "");
        toast.success("Image deleted");
      } catch (error) {
        console.error("Delete operation failed:", error);
        toast.error("Failed to delete");
      } finally {
        setIsDeleting(false);
      }
    };


    return (
      <>
      <div className="px-4 py-5 space-y-4">
        {/* Header: Source Image Thumbnail + Prompt + Actions (Copy, Delete, Timestamp) */}
        <div className="flex justify-between items-start gap-2">
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

            {/* Prompt / Effect */}
            <div className="flex-1">
              <p
                className="text-base font-bold text-white leading-relaxed"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {displayPrompt}
              </p>
            </div>
          </div>

          {/* Right side actions: Timestamp above buttons */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {/* Timestamp */}
            {formatTimestamp() && (
              <span className="text-sm text-gray-400">
                {formatTimestamp()}
              </span>
            )}

            <div className="flex items-center gap-1">
              {/* Copy Button */}
              {!hasEffectInfo && (
                <button
                  onClick={handleCopyPrompt}
                  className="p-0.5 text-gray-400 hover:text-white transition-colors rounded"
                  title="Copy prompt"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}

              {/* Delete Button */}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-0.5 text-gray-400 hover:text-red-400 transition-colors rounded"
                  title="Delete"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Metadata tags - aspect ratio, resolution, model name, and Agent badge */}
        {!hasEffectInfo && (
          <ImageMetadata
            aspectRatio={image.image_size}
            resolution={image.resolution}
            modelName={getImageModel(image.model)?.displayName || image.model}
            isAgentMode={image.is_agent_mode}
            agentImageCount={image.agent_image_count}
          />
        )}

        {/* Enhanced Prompt */}
        {!hasEffectInfo && (
          <EnhancedPrompt
            originalPrompt={image.prompt}
            optimizedPrompt={image.optimized_prompt}
            isExpanded={isExpanded}
            onToggle={onToggleExpanded}
          />
        )}

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
          onDelete={undefined} // 删除按钮已统一在顶部，不传递给 ImageStatusDisplay
          onImageClick={onImageClick}
          onDownload={onDownload}
          isDownloading={isDownloading}
          canEdit={canEdit}
          pollingImages={pollingImages}
        />
      </div>

      {/* Delete confirmation dialog */}
      {onDelete && (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          prompt={deleteLabel || ""}
          isDeleting={isDeleting}
        />
      )}
      </>
    );
  }
);

ImageHistoryItem.displayName = "ImageHistoryItem";

export default ImageHistoryItem;
