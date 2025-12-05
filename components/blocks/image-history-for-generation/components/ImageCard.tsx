import React from "react";
import ImageProgressBar from "./ImageProgressBar";

interface ImageCardProps {
  imageUrl?: string;
  prompt: string;
  index: number;
  total: number;
  isLoading?: boolean;
  progress?: number; // 进度百分比 (0-100)
  remainingTime?: number; // 剩余时间（秒）
  onImageClick?: (imageUrl: string, prompt: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  prompt,
  index,
  total,
  isLoading = false,
  progress = 0,
  remainingTime = 0,
  onImageClick
}) => {
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
