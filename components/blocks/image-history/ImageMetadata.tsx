import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface ImageMetadataProps {
  aspectRatio?: string;
  resolution?: string;
  modelName?: string;
  isAgentMode?: boolean;
  agentImageCount?: number;
}

const ImageMetadata: React.FC<ImageMetadataProps> = React.memo(({
  aspectRatio,
  resolution,
  modelName,
  isAgentMode,
  agentImageCount
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Agent Mode Badge - 橙色醒目标签 */}
      {isAgentMode && (
        <Badge
          variant="secondary"
          className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded border-0 flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Agent {agentImageCount && `(${agentImageCount})`}
        </Badge>
      )}
      {aspectRatio && (
        <Badge
          variant="secondary"
          className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
        >
          {aspectRatio}
        </Badge>
      )}
      {resolution && (
        <Badge
          variant="secondary"
          className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
        >
          {resolution}
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

ImageMetadata.displayName = "ImageMetadata";

export default ImageMetadata;
