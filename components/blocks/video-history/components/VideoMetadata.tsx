import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

interface VideoMetadataProps {
  aspectRatio?: string;
  durationSeconds?: number;
  hasUpsample?: boolean;
  isDowngradedTo720P?: boolean;
  modelName?: string;
}

const VideoMetadata: React.FC<VideoMetadataProps> = React.memo(({
  aspectRatio,
  durationSeconds,
  hasUpsample,
  isDowngradedTo720P,
  modelName,
}) => {
  const t = useTranslations("video-history");

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
        <div className="text-gray-300 text-sm leading-relaxed">
          {modelName}
        </div>
      )}
      {isDowngradedTo720P && (
        <Badge
          variant="secondary"
          className="bg-amber-600 text-white text-xs px-2 py-1 rounded border-0 flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          {t("downgradedTo720P")}
        </Badge>
      )}
    </div>
  );
});

VideoMetadata.displayName = "VideoMetadata";

export default VideoMetadata;
