import React from "react";
import { Badge } from "@/components/ui/badge";

interface ImageMetadataProps {
  aspectRatio?: string;
  modelName?: string;
}

const ImageMetadata: React.FC<ImageMetadataProps> = React.memo(({
  aspectRatio,
  modelName,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {aspectRatio && (
        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
          {aspectRatio}
        </Badge>
      )}
      {modelName && (
        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
          {modelName}
        </Badge>
      )}
    </div>
  );
});

ImageMetadata.displayName = "ImageMetadata";

export default ImageMetadata;
