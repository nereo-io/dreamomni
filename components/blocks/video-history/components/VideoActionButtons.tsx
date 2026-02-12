import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, RotateCcw, Trash2 } from "lucide-react";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoActionButtonsProps {
  generation: VideoGenerationResult;
  onEdit?: (generation: VideoGenerationResult) => void;
  onRegenerate?: (generation: VideoGenerationResult) => void;
  onDelete?: (generation: VideoGenerationResult) => void;
  canEdit?: boolean;
  isDeleting?: boolean;
}

const VideoActionButtons: React.FC<VideoActionButtonsProps> = React.memo(({
  generation,
  onEdit,
  onRegenerate,
  onDelete,
  canEdit = true,
  isDeleting = false
}) => {
  const showEditActions = canEdit && !!onEdit && !!onRegenerate;
  const showDelete = !!onDelete;

  if (!showEditActions && !showDelete) {
    return null;
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(generation);
    }
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegenerate) {
      onRegenerate(generation);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(generation);
    }
  };

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {showEditActions && (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-3"
            onClick={handleEdit}
            disabled={isDeleting}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            <span className="text-xs sm:text-sm">Re-edit</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-3"
            onClick={handleRegenerate}
            disabled={isDeleting}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            <span className="text-xs sm:text-sm">Regenerate</span>
          </Button>
        </>
      )}

      {showDelete && (
        <Button
          variant="secondary"
          size="sm"
          className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-3"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          <span className="text-xs sm:text-sm">{isDeleting ? "Deleting..." : "Delete"}</span>
        </Button>
      )}
    </div>
  );
});

VideoActionButtons.displayName = "VideoActionButtons";

export default VideoActionButtons;
