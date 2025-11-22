import React from "react";
import { Badge } from "@/components/ui/badge";

interface ImageMetadataProps {
  aspectRatio?: string;
  resolution?: string;
  modelName?: string;
}

const ImageMetadata: React.FC<ImageMetadataProps> = React.memo(({
  aspectRatio,
  resolution,
  modelName
}) => {
  return (
    <div className="flex items-center gap-2">
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
