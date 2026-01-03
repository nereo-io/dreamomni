import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  MusicGenerationType,
  MusicGenerationStatus,
  VocalGender,
} from "@/types/music.d";

interface MusicGenerationParams {
  generationType?: MusicGenerationType;
  customMode?: boolean;
  instrumental?: boolean;
  prompt: string;
  title?: string;
  style?: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  uploadAudioUrl?: string;
  modelId?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
  captchaToken?: string;
}

interface UserCreditsInfo {
  remainingCredits: number;
  deductedCredits: number;
}

interface AudioFile {
  audio_url: string | null;
  audio_url_r2: string | null;
  audio_url_provider: string | null;
  image_url: string | null;
  stream_audio_url: string | null;
  duration_seconds: number | null;
  prompt: string | null;
  tags: string | null;
}

interface MusicGenerationResult {
  id: string;
  providerTaskId?: string;
  provider: string;
  model_id: string;
  generation_type: MusicGenerationType;
  custom_mode: boolean;
  instrumental: boolean;
  status: MusicGenerationStatus;
  prompt: string;
  title?: string;
  style?: string;
  // 保留旧字段以兼容老数据
  audio_url?: string;
  audio_url_r2?: string;
  audio_url_provider?: string;
  image_url?: string;
  stream_audio_url?: string;
  generated_tags?: string;
  duration_seconds?: number;
  // 新增：多个音频文件数组
  audio_files?: AudioFile[];
  error_message?: string;
  credits_cost: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  userCredits?: UserCreditsInfo;
}

interface PollOptions {
  interval?: number;
  maxAttempts?: number;
}

export default function useMusicGeneration() {
  const t = useTranslations("music-generator");
  const [isLoading, setIsLoading] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<MusicGenerationResult | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<
    MusicGenerationResult[]
  >([]);
  const [history, setHistory] = useState<MusicGenerationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(
    async (id: string): Promise<MusicGenerationResult | null> => {
      try {
        const response = await fetch(`/api/music-generation/status/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "Failed to check status");
        }

        return result.data;
      } catch (error) {
        console.error("Failed to check status:", error);
        return null;
      }
    },
    []
  );

  const updateCurrentGeneration = useCallback(
    (updates: Partial<MusicGenerationResult>) => {
      setCurrentGeneration((prev) => {
        const updated = prev
          ? { ...prev, ...updates }
          : (updates as MusicGenerationResult);
        return updated;
      });
    },
    []
  );

  useEffect(() => {
    if (!isPolling || !pollingId) {
      clearPollTimeout();
      return;
    }

    const pollFunction = async () => {
      if (pollAttemptsRef.current >= 100) {
        setIsPolling(false);
        setPollingId(null);
        toast.error(t("toast.pollTimeout") || "Poll timeout, please refresh manually");
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

        updateCurrentGeneration({
          ...status,
          id: status.id || pollingId,
        });

        // 直接更新历史列表中对应的任务卡片
        setHistory((prevHistory) => {
          return prevHistory.map((item) => {
            if (item.id === pollingId) {
              return {
                ...item,
                ...status,
                id: status.id || pollingId,
              };
            }
            return item;
          });
        });

        if (status.status === "COMPLETED") {
          setIsPolling(false);
          setPollingId(null);
          toast.success(t("toast.musicCompleted") || "Music generation completed!");
          return;
        }

        if (status.status === "FAILED") {
          setIsPolling(false);
          setPollingId(null);
          toast.error(status.error_message || t("toast.musicFailed") || "Music generation failed");
          return;
        }

      } catch (error) {
        console.error("Error polling status:", error);
        if (pollAttemptsRef.current >= 5) {
          setIsPolling(false);
          setPollingId(null);
          toast.error(t("toast.statusCheckFailed") || "Status check failed, please retry");
        }
      }
    };

    pollFunction();

    const timeoutId = setTimeout(() => {
      pollFunction();
    }, 5000);

    pollTimeoutRef.current = timeoutId;

    return () => clearTimeout(timeoutId);
  }, [isPolling, pollingId, checkStatus, updateCurrentGeneration, t]);

  useEffect(() => {
    return () => {
      clearPollTimeout();
    };
  }, [clearPollTimeout]);

  const submitGeneration = useCallback(
    async (
      params: MusicGenerationParams
    ): Promise<MusicGenerationResult | null> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/music-generation/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "Submission failed");
        }

        const newGeneration: MusicGenerationResult = {
          id: result.data.id,
          providerTaskId: result.data.providerTaskId,
          provider: result.data.provider,
          model_id: result.data.modelId,
          generation_type: params.generationType || 'direct',
          custom_mode: params.customMode !== undefined ? params.customMode : true,
          instrumental: params.instrumental || false,
          status: result.data.status,
          prompt: params.prompt,
          title: params.title,
          style: params.style,
          credits_cost: 12,
          created_at: new Date().toISOString(),
          userCredits: {
            remainingCredits: result.data.userCredits,
            deductedCredits: 12,
          },
        };

        setCurrentGeneration(newGeneration);
        toast.success(t("toast.musicSubmitted") || "Music generation task submitted!");
        return newGeneration;
      } catch (error) {
        console.error("Failed to submit generation task:", error);
        toast.error(error instanceof Error ? error.message : "Submission failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  const pollStatus = useCallback((id: string) => {
    setPollingId(id);
    setIsPolling(true);
    pollAttemptsRef.current = 0;
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingId(null);
    pollAttemptsRef.current = 0;
    clearPollTimeout();
  }, [clearPollTimeout]);

  const fetchHistory = useCallback(
    async (page: number = 1, limit: number = 20) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/music-generation/history?page=${page}&limit=${limit}`
        );
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "Failed to fetch history");
        }

        setHistory(result.data.data);
        return result.data;
      } catch (error) {
        console.error("Failed to fetch history:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch history"
        );
        return null;
      } finally {
        setIsLoadingHistory(false);
      }
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
    pollStatus,
    stopPolling,
    fetchHistory,
    updateCurrentGeneration,
    setHistory,
  };
}

export type { MusicGenerationParams, MusicGenerationResult, AudioFile };
