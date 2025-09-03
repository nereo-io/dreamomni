import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Edit, RotateCcw, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ImageGenerationResult } from "@/components/blocks/image-history";

interface ImageStatusDisplayProps {
  status: string;
  statusInfo: {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }> | null;
  };
  imageUrl?: string;
  errorMessage?: string;
  createdAt?: string;
  image: ImageGenerationResult;
  onEdit?: (image: ImageGenerationResult) => void;
  onRegenerate?: (image: ImageGenerationResult) => void;
  onDelete?: (imageId: string) => void;
  canEdit?: boolean;
  pollingImages: Set<string>;
}

const ImageStatusDisplay: React.FC<ImageStatusDisplayProps> = React.memo(({
  status,
  statusInfo,
  imageUrl,
  errorMessage,
  createdAt,
  image,
  onEdit,
  onRegenerate,
  onDelete,
  canEdit,
  pollingImages,
}) => {
  const isCompleted = status === "completed" || status === "saved_to_r2";
  const isPromptOptimizing = status === "prompt_optimizing";
  const isProcessing = status === "in_progress" || status === "in_queue" || status === "pending";
  const isFailed = status === "failed";
  const isPolling = pollingImages.has(image.id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const t = useTranslations("imageHistory");

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || isDeleting) return;
    
    setIsDeleting(true);
    setShowDeleteDialog(false);
    
    try {
      await onDelete(image.id);
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleDownload = () => {
    if (!imageUrl) {
      toast.error("Image not available for download");
      return;
    }

    // Create download link
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${image.prompt.substring(0, 20).replace(/\s+/g, "_")}_${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded");
  };

  const handleOpen = () => {
    if (!imageUrl) {
      toast.error("Image not available");
      return;
    }
    window.open(imageUrl, "_blank");
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(image);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(image);
    }
  };

  // Prompt Optimizing state - 与视频生成保持一致的样式
  if (isPromptOptimizing) {
    return (
      <div className="space-y-3">
        {/* Prompt Optimizing placeholder with Sparkles effect - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className="w-2/3 aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center py-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                <Sparkles className="h-12 w-12 text-purple-400 relative animate-pulse mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {t("optimizingPromptTitle")}
              </h3>
              <p className="text-sm text-gray-400">
                {t("optimizingPromptDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Disabled action buttons with delete available */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-50"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-400"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted && imageUrl) {
    return (
      <div className="space-y-3">
        {/* Image preview - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div 
            className="w-2/3 aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleOpen}
          >
            <img
              src={imageUrl}
              alt={image.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-gray-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canEdit && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                className="text-gray-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-gray-400 hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-400"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="space-y-3">
        {/* Processing placeholder - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className="w-2/3 aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                {status === "in_progress" ? "Generating..." : status === "in_queue" ? "In Queue..." : "Pending..."}
              </p>
              {isPolling && (
                <div className="flex items-center justify-center mt-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disabled action buttons with delete available */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-50"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-400"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Failed state
  if (isFailed) {
    return (
      <div className="space-y-3">
        {/* Error placeholder - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className="w-2/3 aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-400 mb-2">❌</div>
              <p className="text-sm text-red-400">Generation Failed</p>
              {errorMessage && (
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Retry and Delete buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {canEdit && onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-400"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default state
  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-start">
          <div className="w-2/3 aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-400">Unknown Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {t("deleteConfirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t("deleteConfirmConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

ImageStatusDisplay.displayName = "ImageStatusDisplay";

export default ImageStatusDisplay;
