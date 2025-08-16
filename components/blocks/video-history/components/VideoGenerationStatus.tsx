import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Loader2, Sparkles, Info } from "lucide-react";
import ProgressBar from "./ProgressBar";
import TimeDisplay from "./TimeDisplay";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";

interface VideoGenerationStatusProps {
  status: string;
  createdAt: string;
  estimatedTime?: number;
  modelName?: string;
  className?: string;
  backgroundImage?: string;
  errorMessage?: string;
}

const VideoGenerationStatus: React.FC<VideoGenerationStatusProps> = React.memo(({
  status,
  createdAt,
  estimatedTime = 60,
  modelName,
  className,
  backgroundImage,
  errorMessage
}) => {
  const { elapsedTime, progress, remainingTime } = useGenerationProgress({
    createdAt,
    estimatedTime,
    status
  });

  // Render different UI based on status
  const renderStatusContent = () => {
    switch (status) {
      case "submitted":
      case "PROMPT_OPTIMIZING":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
              <Sparkles className="h-12 w-12 text-purple-400 relative animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              提交你的任务...
            </h3>
            <p className="text-sm text-gray-400">
              {status === "PROMPT_OPTIMIZING" 
                ? "AI is optimizing your prompt for better results"
                : "Preparing your video generation request"}
            </p>
          </div>
        );

      case "IN_QUEUE":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <Clock className="h-12 w-12 text-yellow-400 animate-spin-slow" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              In Queue
            </h3>
            <p className="text-sm text-gray-400">
              Your request is waiting to be processed
            </p>
            {estimatedTime && (
              <div className="mt-3 px-4 py-2 bg-gray-700/50 rounded-lg">
                <TimeDisplay 
                  seconds={estimatedTime} 
                  label="Estimated wait time:" 
                />
              </div>
            )}
          </div>
        );

      case "IN_PROGRESS":
        return (
          <div className="relative w-full h-full bg-gray-700">
            {/* Background image layer */}
            {backgroundImage && (
              <div className="absolute inset-0">
                <img 
                  src={backgroundImage} 
                  alt="" 
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.3) blur(8px)" }}
                />
              </div>
            )}
            
            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-gray-800/50" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
              <div className="w-full space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                  <span className="text-base font-medium text-white">
                    Generating your video...
                  </span>
                </div>

                {/* Progress bar */}
                <ProgressBar progress={progress} showPercentage={false} />
                
                {/* Progress percentage */}
                <div className="text-center text-3xl font-bold text-white">
                  {Math.round(progress)}%
                </div>

                {/* Remaining time - centered */}
                <div className="text-center text-sm text-gray-300">
                  Remaining: <span className="font-medium text-white">{Math.floor(remainingTime)}s</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "FAILED":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
              <Info className="h-12 w-12 text-red-400 relative" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Generation Failed
            </h3>
            {/* Error message */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30 max-w-md">
                <p className="text-xs text-red-300 leading-relaxed">
                  ❌ {errorMessage}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "rounded-lg overflow-hidden",
      className
    )} style={{ width: '438px', height: '288px' }}>
      {renderStatusContent()}
    </div>
  );
});

VideoGenerationStatus.displayName = "VideoGenerationStatus";

export default VideoGenerationStatus;