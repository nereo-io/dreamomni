import React from "react";
import { Badge } from "@/components/ui/badge";

interface VideoMetadataProps {
  aspectRatio?: string;
  durationSeconds?: number;
  hasUpsample?: boolean;
  modelName?: string;
}

const VideoMetadata: React.FC<VideoMetadataProps> = React.memo(({ 
  aspectRatio, 
  durationSeconds, 
  hasUpsample, 
  modelName 
}) => {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
      >
        {aspectRatio || "Auto"}
      </Badge>
      <Badge
        variant="secondary"
        className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
      >
        {durationSeconds || 5}s
      </Badge>
      {hasUpsample && (
        <Badge
          variant="secondary"
          className="bg-blue-600 text-white text-xs px-2 py-1 rounded border-0"
        >
          ↑ HD
        </Badge>
      )}
      {modelName && (
        <div className="text-gray-300 flex-1 text-sm leading-relaxed">
          {modelName}
        </div>
      )}
    </div>
  );
});

VideoMetadata.displayName = "VideoMetadata";

export default VideoMetadata;