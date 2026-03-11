import { useState, useCallback } from "react";
import type { ImageGenerationParams } from "@/types/image.d";
import { trackUetEvent } from "@/lib/bing-uet";

export interface ImageGenerationResult {
  id: string;
  prompt: string;
  image_url?: string;
  status: "pending" | "processing" | "completed" | "failed";
  model: string;
  mode: "text-to-image" | "image-edit";
  created_at: string;
  updated_at: string;
  credits_used: number;
  error_message?: string;
  // Agent mode fields
  is_agent_mode?: boolean;
  agent_image_count?: number;
  image_urls?: string[];
  image_urls_r2?: string[];
  metadata?: Record<string, unknown>;
}

export type { ImageGenerationParams };

interface SubmitGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    image_url?: string;
    images?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
  message?: string;
  timeout?: boolean; // 请求超时标志，超时时应轮询 history
}

interface PollStatusResponse {
  success: boolean;
  data?: ImageGenerationResult;
  message?: string;
}

interface FetchHistoryResponse {
  success: boolean;
  data?: ImageGenerationResult[];
  message?: string;
}

export default function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);

  // Submit image generation request
  // 超时时返回 timeout: true，调用方应轮询 history 获取结果
  const submitGeneration = useCallback(async (params: ImageGenerationParams): Promise<SubmitGenerationResponse> => {
    setIsLoading(true);

    // 超时时间：同步模式可能需要较长时间，设置 60 秒
    const SUBMIT_TIMEOUT = 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT);

    try {
      console.log("Submitting image generation request:", params);

      const response = await fetch("/api/image-generation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.code === 0) {
        trackUetEvent("image_generation_started", {
          event_category: "generation",
          event_label: params.model,
          generation_mode: params.mode,
          provider: params.provider,
        });

        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.message || "Unknown error occurred");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Submit generation error:", error);

      // 检查是否为超时错误（AbortError）
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Submit request timed out, should poll history for result");
        return {
          success: false,
          timeout: true,
          message: "Request timed out. Checking generation history...",
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll generation status
  const pollStatus = useCallback(async (generationId: string): Promise<PollStatusResponse> => {
    try {
      const response = await fetch("/api/image-generation/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: generationId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.code === 0) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Poll status error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }, []);

  // Fetch image generation history
  const fetchHistory = useCallback(async (): Promise<FetchHistoryResponse> => {
    try {
      const response = await fetch("/api/image-generations/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.code === 0) {
        return {
          success: true,
          data: result.data || [],
        };
      } else {
        throw new Error(result.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Fetch history error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      return {
        success: false,
        message: errorMessage,
        data: [],
      };
    }
  }, []);

  // Start polling for a specific generation
  const startPolling = useCallback((generationId: string, onUpdate: (result: ImageGenerationResult) => void) => {
    let pollCount = 0;
    const maxPollCount = 300; // 最大轮询5分钟 (300秒)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      // 超过最大轮询次数则停止
      if (pollCount > maxPollCount) {
        console.warn(`Polling stopped for ${generationId}: max poll count reached`);
        clearInterval(pollInterval);
        return;
      }
      
      const response = await pollStatus(generationId);
      
      if (response.success && response.data) {
        onUpdate(response.data);
        
        // Stop polling if generation is completed or failed
        if (response.data.status === "completed" || response.data.status === "failed") {
          console.log(`Polling stopped for ${generationId}: status is ${response.data.status}`);
          clearInterval(pollInterval);
        }
      } else {
        // 如果请求失败，记录错误但继续轮询
        console.error(`Poll failed for ${generationId}:`, response.message);
      }
    }, 2000); // Poll every 2 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
      console.log(`Polling cleanup for ${generationId}`);
    };
  }, [pollStatus]);

  // Enhanced polling with exponential backoff for failed requests
  const startSmartPolling = useCallback((
    generationId: string, 
    onUpdate: (result: ImageGenerationResult) => void,
    onComplete?: (result: ImageGenerationResult) => void,
    onError?: (error: string) => void
  ) => {
    let pollCount = 0;
    let failedAttempts = 0;
    const maxPollCount = 300; // 5分钟
    const maxFailedAttempts = 10; // 最大失败重试次数
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      // 超过最大轮询次数则停止
      if (pollCount > maxPollCount) {
        console.warn(`Smart polling stopped for ${generationId}: timeout`);
        clearInterval(pollInterval);
        onError?.("轮询超时：生成时间过长");
        return;
      }
      
      // 失败次数过多则停止
      if (failedAttempts > maxFailedAttempts) {
        console.warn(`Smart polling stopped for ${generationId}: too many failures`);
        clearInterval(pollInterval);
        onError?.("轮询失败：网络错误过多");
        return;
      }
      
      const response = await pollStatus(generationId);
      
      if (response.success && response.data) {
        failedAttempts = 0; // 重置失败计数
        onUpdate(response.data);
        
        // Stop polling if generation is completed or failed
        if (response.data.status === "completed") {
          console.log(`Smart polling completed for ${generationId}`);
          clearInterval(pollInterval);
          onComplete?.(response.data);
        } else if (response.data.status === "failed") {
          console.log(`Smart polling failed for ${generationId}`);
          clearInterval(pollInterval);
          onError?.(response.data.error_message || "图片生成失败");
        }
      } else {
        failedAttempts++;
        console.error(`Smart poll failed for ${generationId} (attempt ${failedAttempts}):`, response.message);
      }
    }, 2000); // Poll every 2 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
      console.log(`Smart polling cleanup for ${generationId}`);
    };
  }, [pollStatus]);

  return {
    submitGeneration,
    pollStatus,
    fetchHistory,
    startPolling,
    startSmartPolling,
    isLoading,
  };
}
