import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface VideoGenerationParams {
  model: string;
  prompt: string;
  image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: string;
  resolution?: string;
  generate_audio?: boolean;
  cfg_scale?: number;
  seed?: number;
}

interface VideoGenerationResult {
  id: string;
  requestId: string;
  model: string;
  status: string;
  prompt: string;
  optimized_prompt?: string;
  video_url?: string;
  video_url_r2?: string;
  video_url_fal?: string;
  video_url_volcano?: string;
  video_url_veo3?: string;
  upsample_video_url_veo3?: string;
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
  const t = useTranslations("video-generator");
  const [isLoading, setIsLoading] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<VideoGenerationResult | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<
    VideoGenerationResult[]
  >([]);
  const [history, setHistory] = useState<VideoGenerationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  // 清理轮询
  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

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

  // 轮询状态实现
  useEffect(() => {
    if (!isPolling || !pollingId) {
      clearPollTimeout();
      return;
    }

    const pollFunction = async () => {
      if (pollAttemptsRef.current >= 100) {
        setIsPolling(false);
        setPollingId(null);
        toast.error("查询超时，请手动刷新状态");
        return;
      }

      pollAttemptsRef.current++;

      try {
        const status = await checkStatus(pollingId);

        if (!status) {
          setIsPolling(false);
          setPollingId(null);
          return;
        }

        // Debug log to see what we're getting from the status API
        console.log("Status update received:", {
          status: status.status,
          video_url: status.video_url,
          video_url_r2: status.video_url_r2,
          video_url_volcano: status.video_url_volcano,
          video_url_veo3: status.video_url_veo3,
          video_url_fal: status.video_url_fal,
        });

        // 确保更新所有字段，包括所有视频URL
        const updatedGeneration = {
          ...currentGeneration,
          ...status,
          // 显式确保所有URL字段都被更新
          video_url: status.video_url || currentGeneration?.video_url,
          video_url_r2: status.video_url_r2 || currentGeneration?.video_url_r2,
          video_url_fal: status.video_url_fal || currentGeneration?.video_url_fal,
          video_url_volcano: status.video_url_volcano || currentGeneration?.video_url_volcano,
          video_url_veo3: status.video_url_veo3 || currentGeneration?.video_url_veo3,
          upsample_video_url_veo3: status.upsample_video_url_veo3 || currentGeneration?.upsample_video_url_veo3,
        };
        
        setCurrentGeneration(updatedGeneration);

        // 同时更新最近生成记录中对应的项
        setRecentGenerations((prev) =>
          prev.map((gen) =>
            gen.id === pollingId ? updatedGeneration : gen
          )
        );

        // 检查是否完成
        if (status.status === "COMPLETED" || status.status === "SAVED_TO_R2") {
          setIsPolling(false);
          setPollingId(null);
          pollAttemptsRef.current = 0;
          toast.success(t("toast.videoCompleted"));
          return;
        } else if (status.status === "FAILED") {
          setIsPolling(false);
          setPollingId(null);
          pollAttemptsRef.current = 0;
          toast.error(status.error_message || t("toast.videoFailed"));
          return;
        } else {
          // 继续轮询
          pollTimeoutRef.current = setTimeout(pollFunction, 3000);
        }
      } catch (error) {
        console.error("轮询状态时出错:", error);
        // 如果出错，继续尝试轮询
        pollTimeoutRef.current = setTimeout(pollFunction, 5000); // 出错时延长间隔
      }
    };

    // 开始轮询
    pollTimeoutRef.current = setTimeout(pollFunction, 1000); // 首次轮询延迟1秒

    return () => {
      clearPollTimeout();
    };
  }, [isPolling, pollingId, checkStatus, clearPollTimeout]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearPollTimeout();
    };
  }, [clearPollTimeout]);

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

        // 构建更新数据，保持现有的 created_at 不变
        const updates: Partial<VideoGenerationResult> = {
          id: result.data.id,
          requestId: result.data.requestId,
          model: result.data.model,
          status: result.data.metadata?.optimized_prompt ? "PROMPT_OPTIMIZING" : "IN_QUEUE",
          optimized_prompt: result.data.metadata?.optimized_prompt,
        };

        // 如果当前没有生成记录，创建完整记录
        if (!currentGeneration) {
          const newGeneration: VideoGenerationResult = {
            id: result.data.id,
            requestId: result.data.requestId,
            model: result.data.model,
            status: "submitted",
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio,
            duration_seconds: parseInt(params.duration || "5"),
            created_at: new Date().toISOString(),
            optimized_prompt: result.data.metadata?.optimized_prompt,
          };
          setCurrentGeneration(newGeneration);
        } else {
          // 如果已有记录，只更新必要字段，保持 created_at 不变
          setCurrentGeneration(prev => prev ? { ...prev, ...updates } : null);
        }
        toast.success(t("toast.videoSubmitted"));

        // 返回当前的生成记录
        return currentGeneration ? { ...currentGeneration, ...updates } : {
          id: result.data.id,
          requestId: result.data.requestId,
          model: result.data.model,
          status: "submitted",
          prompt: params.prompt,
          aspect_ratio: params.aspect_ratio,
          duration_seconds: parseInt(params.duration || "5"),
          created_at: new Date().toISOString(),
          optimized_prompt: result.data.metadata?.optimized_prompt,
        };
      } catch (error) {
        console.error("提交视频生成失败:", error);
        toast.error(error instanceof Error ? error.message : "提交失败");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentGeneration]
  );

  // 轮询状态 - 简化版本，现在由useEffect管理
  const pollStatus = useCallback((id: string) => {
    setPollingId(id);
    setIsPolling(true);
    pollAttemptsRef.current = 0;
  }, []);

  // 停止轮询
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingId(null);
    pollAttemptsRef.current = 0;
    clearPollTimeout();
  }, [clearPollTimeout]);

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

  // 清除所有生成记录
  const clearAllGenerations = useCallback(() => {
    setCurrentGeneration(null);
    setRecentGenerations([]);
  }, []);

  // 更新当前生成记录
  const updateCurrentGeneration = useCallback(
    (updates: Partial<VideoGenerationResult>) => {
      setCurrentGeneration((prev) => (prev ? { ...prev, ...updates } : updates as VideoGenerationResult));
    },
    []
  );

  return {
    isLoading,
    currentGeneration,
    recentGenerations,
    history,
    isLoadingHistory,
    isPolling,
    submitGeneration,
    checkStatus,
    pollStatus,
    stopPolling,
    fetchHistory,
    clearCurrentGeneration,
    clearAllGenerations,
    updateCurrentGeneration,
  };
}
