import React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageProgressBar from "./ImageProgressBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageCardProps {
  imageUrl?: string;
  prompt: string;
  index: number;
  total: number;
  isLoading?: boolean;
  progress?: number; // 进度百分比 (0-100)
  remainingTime?: number; // 剩余时间（秒）
  onImageClick?: (imageUrl: string, prompt: string) => void;
  onDownload?: (imageUrl: string, prompt: string, index: number) => void;
  isDownloading?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  prompt,
  index,
  total,
  isLoading = false,
  progress = 0,
  remainingTime = 0,
  onImageClick,
  onDownload,
  isDownloading = false,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative group cursor-pointer aspect-square">
      {imageUrl && !isLoading ? (
        <>
          <img
            src={imageUrl}
            alt={`${prompt} - Image ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
            onClick={() => onImageClick?.(imageUrl, `${prompt} (${index + 1}/${total})`)}
            loading="lazy"
          />
          {/* Hover download button */}
          {onDownload && (
            <div className={`absolute top-2 right-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 z-10`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-black/60 hover:bg-black/80 text-white border-none h-8 w-8 p-0 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(imageUrl, prompt, index);
                }}
                disabled={isDownloading}
                title="Download image"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {index + 1}/{total}
          </div>
        </>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg bg-gray-800">
            {/* Background with subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg" />

            {/* Content */}
            <div className="relative z-10 text-center w-full px-3 py-2">
              {/* Progress bar */}
              <div className="w-full mb-2">
                <ImageProgressBar
                  progress={progress}
                  showPercentage={false}
                />
              </div>

              {/* Progress percentage only - no remaining time */}
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {index + 1}/{total}
          </div>
        </>
      )}
    </div>
  );
};
