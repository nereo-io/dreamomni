import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface VideoGenerationParams {
  model: string;
  prompt: string;
  image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: string;
  cfg_scale?: number;
  seed?: number;
}

interface VideoGenerationResult {
  id: string;
  requestId: string;
  model: string;
  status: string;
  prompt: string;
  video_url?: string;
  error_message?: string;
  created_at?: string;
  aspect_ratio?: string;
  duration_seconds?: number;
}

interface PollOptions {
  interval?: number;
  maxAttempts?: number;
}

export default function useVideoGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<VideoGenerationResult | null>(null);
  const [history, setHistory] = useState<VideoGenerationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 提交视频生成任务
  const submitGeneration = useCallback(
    async (
      params: VideoGenerationParams
    ): Promise<VideoGenerationResult | null> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/video-generation/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "提交失败");
        }

        const generation: VideoGenerationResult = {
          id: result.data.id,
          requestId: result.data.requestId,
          model: result.data.model,
          status: "submitted",
          prompt: params.prompt,
          aspect_ratio: params.aspect_ratio,
          duration_seconds: parseInt(params.duration || "5"),
        };

        setCurrentGeneration(generation);
        toast.success("视频生成任务已提交，正在处理中...");

        return generation;
      } catch (error) {
        console.error("提交视频生成失败:", error);
        toast.error(error instanceof Error ? error.message : "提交失败");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 查询生成状态
  const checkStatus = useCallback(
    async (id: string): Promise<VideoGenerationResult | null> => {
      try {
        const response = await fetch("/api/video-generation/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "查询状态失败");
        }

        return result.data;
      } catch (error) {
        console.error("查询状态失败:", error);
        return null;
      }
    },
    []
  );

  // 轮询状态
  const pollStatus = useCallback(
    async (
      id: string,
      options: PollOptions = {}
    ): Promise<VideoGenerationResult | null> => {
      const { interval = 3000, maxAttempts = 100 } = options;
      let attempts = 0;

      const poll = async (): Promise<VideoGenerationResult | null> => {
        if (attempts >= maxAttempts) {
          toast.error("查询超时，请手动刷新状态");
          return null;
        }

        attempts++;
        const status = await checkStatus(id);

        if (!status) {
          return null;
        }

        setCurrentGeneration(status);

        // 检查是否完成
        if (status.status === "COMPLETED" || status.status === "SAVED_TO_R2") {
          toast.success("视频生成完成!");
          return status;
        } else if (status.status === "FAILED") {
          toast.error(status.error_message || "视频生成失败");
          return status;
        } else {
          // 继续轮询
          setTimeout(() => poll(), interval);
          return null;
        }
      };

      return poll();
    },
    [checkStatus]
  );

  // 获取历史记录
  const fetchHistory = useCallback(
    async (page: number = 1, limit: number = 10) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/video-generations/history?page=${page}&limit=${limit}`
        );
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "获取历史记录失败");
        }

        setHistory(result.data.data);
        return result.data;
      } catch (error) {
        console.error("获取历史记录失败:", error);
        toast.error(
          error instanceof Error ? error.message : "获取历史记录失败"
        );
        return null;
      } finally {
        setIsLoadingHistory(false);
      }
    },
    []
  );

  // 清除当前生成
  const clearCurrentGeneration = useCallback(() => {
    setCurrentGeneration(null);
  }, []);

  return {
    isLoading,
    currentGeneration,
    history,
    isLoadingHistory,
    submitGeneration,
    checkStatus,
    pollStatus,
    fetchHistory,
    clearCurrentGeneration,
  };
}
