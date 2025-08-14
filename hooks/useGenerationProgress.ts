import { useState, useEffect, useCallback } from "react";

interface UseGenerationProgressProps {
  createdAt: string;
  estimatedTime?: number; // in seconds
  status: string;
}

interface GenerationProgress {
  elapsedTime: number; // in seconds
  progress: number; // 0-100
  remainingTime: number; // in seconds
  isComplete: boolean;
}

export function useGenerationProgress({
  createdAt,
  estimatedTime = 60, // default 1 minute if not provided
  status
}: UseGenerationProgressProps): GenerationProgress {
  const [progress, setProgress] = useState<GenerationProgress>({
    elapsedTime: 0,
    progress: 0,
    remainingTime: estimatedTime,
    isComplete: false
  });

  const calculateProgress = useCallback(() => {
    if (!createdAt) return progress;
    
    const startTime = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000); // Convert to seconds
    
    // If completed or failed, set progress accordingly
    if (status === "COMPLETED" || status === "SAVED_TO_R2") {
      return {
        elapsedTime: elapsed,
        progress: 100,
        remainingTime: 0,
        isComplete: true
      };
    }
    
    if (status === "FAILED") {
      return {
        elapsedTime: elapsed,
        progress: 0,
        remainingTime: 0,
        isComplete: false
      };
    }
    
    // For in-progress statuses
    if (["IN_PROGRESS", "IN_QUEUE", "PROMPT_OPTIMIZING"].includes(status)) {
      // Calculate progress based on estimated time
      let progressPercentage = (elapsed / estimatedTime) * 100;
      
      // Cap progress at 95% if still processing (to avoid showing 100% before completion)
      if (progressPercentage >= 95 && status !== "COMPLETED") {
        progressPercentage = 95;
      }
      
      // Calculate remaining time
      const remaining = Math.max(0, estimatedTime - elapsed);
      
      return {
        elapsedTime: elapsed,
        progress: Math.min(progressPercentage, 100),
        remainingTime: remaining,
        isComplete: false
      };
    }
    
    // For submitted status, show minimal progress
    if (status === "submitted") {
      return {
        elapsedTime: elapsed,
        progress: 5,
        remainingTime: estimatedTime - elapsed,
        isComplete: false
      };
    }
    
    return progress;
  }, [createdAt, estimatedTime, status, progress]);

  useEffect(() => {
    // Initial calculation
    setProgress(calculateProgress());
    
    // Don't set interval if completed or failed
    if (status === "COMPLETED" || status === "SAVED_TO_R2" || status === "FAILED") {
      return;
    }
    
    // Update progress every second
    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [calculateProgress, status]);

  return progress;
}