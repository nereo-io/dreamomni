import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, RotateCcw } from "lucide-react";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoActionButtonsProps {
  generation: VideoGenerationResult;
  onEdit: (generation: VideoGenerationResult) => void;
  onRegenerate: (generation: VideoGenerationResult) => void;
  canEdit?: boolean;
}

const VideoActionButtons: React.FC<VideoActionButtonsProps> = React.memo(({
  generation,
  onEdit,
  onRegenerate,
  canEdit = true
}) => {
  if (!canEdit) {
    return null;
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(generation);
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerate(generation);
  };

  return (
    <div className="flex gap-3 mt-3">
      <Button
        variant="secondary"
        size="sm"
        className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-4"
        onClick={handleEdit}
      >
        <Edit className="h-4 w-4 mr-2" />
        Re-edit
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-4"
        onClick={handleRegenerate}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Regenerate
      </Button>
    </div>
  );
});

VideoActionButtons.displayName = "VideoActionButtons";

export default VideoActionButtons;