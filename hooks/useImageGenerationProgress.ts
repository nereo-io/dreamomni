import { useState, useEffect, useCallback } from "react";

interface UseImageGenerationProgressProps {
  createdAt?: string;
  estimatedTime?: number; // in seconds
  status: string;
}

interface ImageGenerationProgress {
  elapsedTime: number; // in seconds
  progress: number; // 0-100
  remainingTime: number; // in seconds
  isComplete: boolean;
}

export function useImageGenerationProgress({
  createdAt,
  estimatedTime = 30, // default 30 seconds for image generation (faster than video)
  status
}: UseImageGenerationProgressProps): ImageGenerationProgress {
  const [progress, setProgress] = useState<ImageGenerationProgress>({
    elapsedTime: 0,
    progress: 0,
    remainingTime: estimatedTime,
    isComplete: false
  });

  const calculateProgress = useCallback(() => {
    if (!createdAt) {
      return {
        elapsedTime: 0,
        progress: 0,
        remainingTime: estimatedTime,
        isComplete: false
      };
    }
    
    const startTime = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000); // Convert to seconds
    
    // If completed or failed, set progress accordingly
    if (status === "completed" || status === "saved_to_r2") {
      return {
        elapsedTime: elapsed,
        progress: 100,
        remainingTime: 0,
        isComplete: true
      };
    }
    
    if (status === "failed") {
      return {
        elapsedTime: elapsed,
        progress: 0,
        remainingTime: 0,
        isComplete: false
      };
    }
    
    // For in-progress statuses - unified progress calculation based on elapsed time
    if (["in_progress", "in_queue", "pending", "prompt_optimizing"].includes(status)) {
      // Calculate progress based on elapsed time over 30 seconds
      let progressPercentage = (elapsed / estimatedTime) * 100;
      
      // Cap progress at 95% for all processing states
      progressPercentage = Math.min(progressPercentage, 95);
      
      // Calculate remaining time
      const remaining = Math.max(0, estimatedTime - elapsed);
      
      return {
        elapsedTime: elapsed,
        progress: Math.min(progressPercentage, 100),
        remainingTime: remaining,
        isComplete: false
      };
    }
    
    // For unknown status, show minimal progress
    return {
      elapsedTime: elapsed,
      progress: 5,
      remainingTime: Math.max(0, estimatedTime - elapsed),
      isComplete: false
    };
  }, [createdAt, estimatedTime, status]);

  useEffect(() => {
    // Update progress immediately
    setProgress(calculateProgress());

    // Set up interval to update progress every second
    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateProgress]);

  return progress;
}
