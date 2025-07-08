"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  History,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideoModel } from "@/config/video-models";

interface VideoResultProps {
  generation?: {
    id: string;
    requestId?: string;
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
  } | null;
  generatedVideo?: string | null;
  isGenerating?: boolean;
  placeholderIcon?: React.ReactNode;
  placeholderText?: string;
  onRetry?: () => void;
  onVideoUrlUpdate?: (videoUrl: string) => void;
  className?: string;
}

const getStatusMap = (t: any) => ({
  submitted: {
    label: t("status.submitted"),
    color: "bg-blue-500",
    icon: Clock,
  },
  PROMPT_OPTIMIZING: {
    label: t("status.optimizingPrompt"),
    color: "bg-purple-500",
    icon: Loader2,
  },
  IN_QUEUE: { label: t("status.inQueue"), color: "bg-yellow-500", icon: Clock },
  IN_PROGRESS: {
    label: t("status.generating"),
    color: "bg-orange-500",
    icon: Loader2,
  },
  COMPLETED: {
    label: t("status.completed"),
    color: "bg-green-500",
    icon: CheckCircle,
  },
  SAVED_TO_R2: {
    label: t("status.completed"),
    color: "bg-green-500",
    icon: CheckCircle,
  },
  FAILED: { label: t("status.failed"), color: "bg-red-500", icon: XCircle },
});

// 默认等待时间：45秒
const DEFAULT_WAIT_TIME_SECONDS = 45;

// 错误处理函数
const getFriendlyErrorMessage = (apiErrorMessage?: string, t?: any): string => {
  if (!apiErrorMessage) {
    return t
      ? t("errorMessages.unexpected")
      : "An unexpected error occurred. Please try again.";
  }

  // Handle specific sensitive content errors first
  if (
    apiErrorMessage.includes("OutputVideoSensitiveContentDetected") ||
    apiErrorMessage.includes("output video may contain sensitive information")
  ) {
    return "Video generation failed because the result may contain sensitive content. Please modify your prompt and try again.";
  }
  if (
    apiErrorMessage.includes("InputImageSensitiveContentDetected") ||
    apiErrorMessage.includes("input image may contain sensitive information")
  ) {
    return "Video generation failed because the uploaded image may contain sensitive content. Please use a different image.";
  }

  // 首先尝试从字符串中直接提取状态码
  const statusCodeMatch = apiErrorMessage.match(
    /(?:status code|code):\s*(\d+)/i
  );
  if (statusCodeMatch && statusCodeMatch[1]) {
    const statusCode = parseInt(statusCodeMatch[1], 10);
    switch (statusCode) {
      case 400:
        return "A problem occurred with an external service. Please try again later.";
      case 422:
        return "There's an issue with your input or settings. Please check and try again.";
      case 500:
        return "An unexpected error occurred on our end. Please try again later.";
      case 504:
        return "The request took too long and timed out. Please try again.";
      default:
        return `An error occurred (Status ${statusCode}). Please try again.`;
    }
  }

  return apiErrorMessage;
};

export default function VideoResult({
  generation,
  generatedVideo,
  isGenerating = false,
  placeholderIcon,
  placeholderText = "Upload an image and click generate to create your video",
  onRetry,
  onVideoUrlUpdate,
  className,
}: VideoResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // 获取优先级最高的视频URL
  const getVideoUrl = (gen?: VideoResultProps['generation']) => {
    if (!gen) return generatedVideo;
    // 优先使用API已经处理好的video_url字段，它已经应用了正确的优先级逻辑
    // 如果没有，则手动应用优先级逻辑作为备用
    return (
      gen.video_url ||
      gen.video_url_r2 ||
      gen.upsample_video_url_veo3 ||
      gen.video_url_veo3 ||
      gen.video_url_volcano ||
      gen.video_url_fal ||
      generatedVideo
    );
  };

  const [videoUrl, setVideoUrl] = useState(getVideoUrl(generation));
  const [currentTime, setCurrentTime] = useState(Date.now());
  const router = useRouter();
  const t = useTranslations("video-result");

  // 当generation对象发生变化时，重置videoUrl状态
  useEffect(() => {
    const newVideoUrl = getVideoUrl(generation);
    setVideoUrl(newVideoUrl);
  }, [
    generation?.id, 
    generation?.video_url,
    generation?.video_url_r2, 
    generation?.upsample_video_url_veo3,
    generation?.video_url_veo3,
    generation?.video_url_volcano,
    generation?.video_url_fal,
    generatedVideo
  ]);

  // 获取模型配置以确定等待时间
  const modelConfig = generation ? getVideoModel(generation.model) : null;
  const TOTAL_WAIT_TIME_SECONDS =
    modelConfig?.estimatedGenerationTime || DEFAULT_WAIT_TIME_SECONDS;

  // 如果没有generation数据，使用简化模式
  if (!generation) {
    return (
      <div className={cn("bg-gray-900 rounded-lg p-6", className)}>
        <h2 className="text-white text-lg font-semibold mb-3">Generated Video</h2>
        
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
          {videoUrl ? (
            <>
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Generating your video...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a few minutes</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              {placeholderIcon}
              <p className="text-gray-400">{placeholderText}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const STATUS_MAP = getStatusMap(t);
  const status =
    STATUS_MAP[generation.status as keyof typeof STATUS_MAP] ||
    STATUS_MAP.submitted;
  const isCompleted =
    generation.status === "COMPLETED" || generation.status === "SAVED_TO_R2";
  const isFailed = generation.status === "FAILED";
  const isProcessing =
    generation.status === "IN_PROGRESS" ||
    generation.status === "IN_QUEUE" ||
    generation.status === "submitted" ||
    generation.status === "PROMPT_OPTIMIZING";

  // 定时器更新当前时间
  useEffect(() => {
    if (!isProcessing) return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing]);

  // 当状态为完成但没有视频URL时，主动获取结果
  useEffect(() => {
    const fetchVideoResult = async () => {
      if (
        isCompleted &&
        !videoUrl &&
        generation.requestId &&
        generation.model &&
        !isLoadingVideo
      ) {
        setIsLoadingVideo(true);
        try {
          const response = await fetch(
            `/api/video-generation/result?model=${encodeURIComponent(
              generation.model
            )}&requestId=${encodeURIComponent(generation.requestId)}`
          );

          if (response.ok) {
            const result = await response.json();
            if (result.code === 0 && result.data?.video_url) {
              const newVideoUrl = result.data.video_url;
              setVideoUrl(newVideoUrl);
              if (onVideoUrlUpdate) {
                onVideoUrlUpdate(newVideoUrl);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching video result:", error);
        } finally {
          setIsLoadingVideo(false);
        }
      }
    };

    fetchVideoResult();
  }, [
    isCompleted,
    videoUrl,
    generation.requestId,
    generation.model,
    isLoadingVideo,
    onVideoUrlUpdate,
  ]);

  // 计算已等待时间和剩余时间
  const getWaitTimeInfo = () => {
    if (!generation.created_at) {
      return {
        elapsedSeconds: 0,
        remainingSeconds: TOTAL_WAIT_TIME_SECONDS,
        progressValue: 0,
      };
    }

    const createdTime = new Date(generation.created_at).getTime();
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);
    const remainingSeconds = Math.max(
      0,
      TOTAL_WAIT_TIME_SECONDS - elapsedSeconds
    );
    const progressValue = Math.min(
      100,
      Math.max(0, (elapsedSeconds / TOTAL_WAIT_TIME_SECONDS) * 100)
    );

    return { elapsedSeconds, remainingSeconds, progressValue };
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 根据时间计算进度百分比
  const getProgressValue = () => {
    if (!isProcessing) {
      switch (generation.status) {
        case "COMPLETED":
        case "SAVED_TO_R2":
          return 100;
        case "FAILED":
          return 0;
        default:
          return 5;
      }
    }

    return getWaitTimeInfo().progressValue;
  };

  const progressValue = getProgressValue();
  const { remainingSeconds } = getWaitTimeInfo();

  const handleDownload = async () => {
    if (!videoUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      window.open(videoUrl, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn("bg-gray-900 rounded-lg p-6", className)}>
      <h2 className="text-white text-lg font-semibold mb-3">Generated Video</h2>
      
      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative mb-4">
        {isCompleted && videoUrl && !isFailed ? (
          <video
            className="w-full h-full object-cover"
            controls
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ aspectRatio: generation.aspect_ratio || "16/9" }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : isProcessing || isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center gap-2 mb-4">
              <status.icon
                className={cn(
                  "h-6 w-6 text-white",
                  status.icon === Loader2 && "animate-spin"
                )}
              />
              <Badge className={cn(status.color, "text-white")}>
                {status.label}
              </Badge>
            </div>
            <p className="text-gray-400 mb-2">
              {formatTime(remainingSeconds)} remaining
            </p>
            <Progress value={progressValue} className="w-full max-w-xs mb-2" />
            <p className="text-gray-500 text-sm">
              {modelConfig?.displayName || generation.model}
            </p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <XCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-400 mb-2">Generation Failed</p>
            <p className="text-gray-500 text-sm mb-4">
              {getFriendlyErrorMessage(generation.error_message, t)}
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {placeholderIcon}
            <p className="text-gray-400">{placeholderText}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isCompleted && videoUrl && !isFailed && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}

      {/* Prompt Display for completed videos */}
      {isCompleted && videoUrl && !isFailed && generation.prompt && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Original Prompt:</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {generation.prompt}
          </p>
          {generation.optimized_prompt && generation.optimized_prompt !== generation.prompt && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Enhanced Prompt:
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {generation.optimized_prompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}