import React from "react";
import { cn } from "@/lib/utils";

interface ImageProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}

const ImageProgressBar: React.FC<ImageProgressBarProps> = React.memo(({
  progress,
  className,
  showPercentage = true
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar container */}
      <div className="relative w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
        {/* Progress bar fill with primary theme color (purple) */}
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      
      {/* Percentage display */}
      {showPercentage && (
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
});

ImageProgressBar.displayName = "ImageProgressBar";

export default ImageProgressBar;
