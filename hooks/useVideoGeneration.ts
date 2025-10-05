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
  enable_prompt_enhancement?: boolean;
  cfg_scale?: number;
  seed?: number;
  effect_id?: string; // For video effects feature
  effect_type?: 'hailuo_prompt' | 'pixverse_template'; // Route selection
  pixverse_img_ids?: number[]; // For pixverse template effects
  captchaToken?: string; // For CAPTCHA verification
  watermarkEnabled?: boolean; // Frontend flag for Seedance watermark control
}

interface UserCreditsInfo {
  remainingCredits: number;
  deductedCredits: number;
}

interface VideoGenerationResult {
  id: string;
  requestId: string;
  model_id: string;
  status: string;
  prompt: string;
  optimized_prompt?: string;
  video_url?: string;
  video_url_r2?: string;
  video_url_fal?: string;
  video_url_volcano?: string;
  video_url_veo3?: string;
  video_url_sora?: string;
  upsample_video_url_veo3?: string;
  error_message?: string;
  created_at?: string;
  aspect_ratio?: string;
  duration_seconds?: number;
  userCredits?: UserCreditsInfo;
  image_url?: string;
  effect_id?: string;
  effect_info?: {
    id: string;
    title: string;
    slug: string;
  };
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

  // 更新当前生成状态
  const updateCurrentGeneration = useCallback(
    (updates: Partial<VideoGenerationResult>) => {
      setCurrentGeneration((prev) => {
        const updated = prev
          ? { ...prev, ...updates }
          : (updates as VideoGenerationResult);
        return updated;
      });
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

        // 更新当前生成状态
        updateCurrentGeneration({
          ...status,
          id: status.id || pollingId,
        });

        // 检查是否完成或失败
        if (status.status === "COMPLETED" || status.status === "SAVED_TO_R2") {
          setIsPolling(false);
          setPollingId(null);
          toast.success(t("toast.videoCompleted"));
          return;
        }

        if (status.status === "FAILED") {
          setIsPolling(false);
          setPollingId(null);
          toast.error(status.error_message || t("toast.videoFailed"));
          return;
        }

        // 继续轮询
      } catch (error) {
        console.error("轮询状态时出错:", error);
        if (pollAttemptsRef.current >= 5) {
          setIsPolling(false);
          setPollingId(null);
          toast.error("状态查询失败，请重试");
        }
      }
    };

    // 立即执行一次
    pollFunction();

    // 设置定时器
    const timeoutId = setTimeout(() => {
      pollFunction();
    }, 3000);

    pollTimeoutRef.current = timeoutId;

    return () => clearTimeout(timeoutId);
  }, [isPolling, pollingId, checkStatus, updateCurrentGeneration, t]);

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
        // 根据 effect_type 决定 API 端点
        let apiEndpoint = "/api/video-generation/submit";
        let requestBody: any = { ...params };
        
        if (
          params.effect_type === 'pixverse_template' &&
          params.pixverse_img_ids
        ) {
          // 使用 PixVerse template API
          apiEndpoint = "/api/video-effects/pixverse/generate";
          requestBody = {
            effectId: params.effect_id,
            imgIds: params.pixverse_img_ids,
            prompt: params.prompt,
            duration: params.duration || "5",
            quality: params.resolution === "1080p" ? "1080p" : "540p",
            model: "v4.5",
            imageUrl: params.image_url // 添加原始图片URL
          };
        }

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "提交失败");
        }

        // 构建更新数据，包含积分信息
        const updates: Partial<VideoGenerationResult> = {
          id: result.data.id,
          requestId: result.data.requestId,
          model_id: params.model,
          status: result.data.status || "submitted",
          prompt: params.prompt,
          optimized_prompt: result.data.optimized_prompt,
          video_url: result.data.video_url,
          error_message: undefined,
          aspect_ratio: params.aspect_ratio,
          duration_seconds: parseInt(params.duration || "5"),
          userCredits: result.data.userCredits,
          image_url: params.image_url,
        };

        // 如果是新的生成任务，创建完整记录
        if (!currentGeneration || currentGeneration.id.startsWith("temp-")) {
          const newGeneration: VideoGenerationResult = {
            id: result.data.id,
            requestId: result.data.requestId,
            model_id: params.model,
            status: result.data.status || "submitted",
            prompt: params.prompt,
            optimized_prompt: result.data.optimized_prompt,
            video_url: result.data.video_url,
            error_message: undefined,
            created_at: new Date().toISOString(),
            aspect_ratio: params.aspect_ratio,
            duration_seconds: parseInt(params.duration || "5"),
            userCredits: result.data.userCredits,
            image_url: params.image_url,
          };
          setCurrentGeneration(newGeneration);
        } else {
          // 更新现有记录
          updateCurrentGeneration(updates);
        }

        toast.success(t("toast.videoSubmitted"));
        return updates as VideoGenerationResult;
      } catch (error) {
        console.error("提交生成任务失败:", error);
        toast.error(error instanceof Error ? error.message : "提交失败");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentGeneration, updateCurrentGeneration, t]
  );

  // 启动轮询
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

        // Map input_image_url to image_url for consistency
        const mappedData = result.data.data.map((item: any) => ({
          ...item,
          image_url: item.input_image_url || item.image_url,
        }));

        setHistory(mappedData);
        return { ...result.data, data: mappedData };
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

  return {
    // 状态
    isLoading,
    currentGeneration,
    recentGenerations,
    history,
    isLoadingHistory,
    isPolling,

    // 操作
    submitGeneration,
    pollStatus,
    stopPolling,
    fetchHistory,
    updateCurrentGeneration,
    setHistory,
  };
}

export type { VideoGenerationParams, VideoGenerationResult };
