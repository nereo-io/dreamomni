"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoResultProps {
  generation: {
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
  };
  onRetry?: () => void;
  onVideoUrlUpdate?: (videoUrl: string) => void;
  className?: string;
}

const STATUS_MAP = {
  submitted: { label: "Submitted", color: "bg-blue-500", icon: Clock },
  IN_QUEUE: { label: "In Queue", color: "bg-yellow-500", icon: Clock },
  IN_PROGRESS: { label: "Generating", color: "bg-orange-500", icon: Loader2 },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  SAVED_TO_R2: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  FAILED: { label: "Failed", color: "bg-red-500", icon: XCircle },
};

// 总等待时间：3分半 = 210秒
const TOTAL_WAIT_TIME_SECONDS = 210;

// 新增辅助函数，用于获取用户友好的错误提示
const getFriendlyErrorMessage = (apiErrorMessage?: string): string => {
  if (!apiErrorMessage) {
    return "An unexpected error occurred. Please try again.";
  }
  console.log("apiErrorMessage", apiErrorMessage);

  // 首先尝试从字符串中直接提取状态码（处理 "Invalid status code: 422" 这样的格式）
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

  // 然后尝试解析为JSON（处理复杂的错误对象）
  try {
    const errorObj = JSON.parse(apiErrorMessage);
    if (errorObj && errorObj.error && typeof errorObj.error === "string") {
      const match = errorObj.error.match(/(\d+)/); // 提取状态码
      if (match && match[1]) {
        const statusCode = parseInt(match[1], 10);
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
            // 如果有更具体的 msg，可以考虑使用，但优先使用我们定义的映射
            if (errorObj.payload?.detail?.[0]?.msg) {
              return errorObj.payload.detail[0].msg;
            }
            return `An error occurred (Status ${statusCode}). Please try again.`;
        }
      }
    }
    // 如果无法从errorObj.error提取状态码，或者不是预期的JSON结构，检查payload
    if (errorObj && errorObj.payload?.detail?.[0]?.msg) {
      return errorObj.payload.detail[0].msg; // 直接使用fal.ai提供的msg
    }
  } catch (e) {
    // JSON解析失败，继续处理普通字符串
  }

  // 如果无法解析或提取状态码，直接显示原始错误信息（如果它不是对象）
  // 但要避免显示过长的原始错误
  if (typeof apiErrorMessage === "string" && apiErrorMessage.length < 200) {
    return apiErrorMessage;
  }
  return "An unexpected error occurred. Please try again.";
};

export default function VideoResult({
  generation,
  onRetry,
  onVideoUrlUpdate,
  className,
}: VideoResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(generation.video_url);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const router = useRouter();

  const status =
    STATUS_MAP[generation.status as keyof typeof STATUS_MAP] ||
    STATUS_MAP.submitted;
  const isCompleted =
    generation.status === "COMPLETED" || generation.status === "SAVED_TO_R2";
  const isFailed = generation.status === "FAILED";
  const isProcessing =
    generation.status === "IN_PROGRESS" ||
    generation.status === "IN_QUEUE" ||
    generation.status === "submitted";

  // 定时器更新当前时间（用于计算等待时长）
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
          console.log("Fetching video result for:", generation.requestId);

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
              // 通知父组件更新视频URL
              if (onVideoUrlUpdate) {
                onVideoUrlUpdate(newVideoUrl);
              }
              console.log("Video URL fetched successfully:", newVideoUrl);
            } else {
              console.error("Failed to get video URL from result:", result);
              console.log("Full result data:", result);

              // 如果获取视频结果失败，可能需要重新检查状态
              // 这里可以添加逻辑通知父组件状态可能有问题
              if (result.message && result.message.includes("Unprocessable")) {
                console.warn("视频结果不可处理，可能需要重新检查状态");
                // 可以触发状态重新检查
                if (onRetry) {
                  setTimeout(() => {
                    console.log("自动重新检查状态");
                    onRetry();
                  }, 2000);
                }
              }
            }
          } else {
            console.error("Failed to fetch video result:", response.status);

            // 如果是422错误（Unprocessable Entity），可能需要重新检查状态
            if (response.status === 422) {
              console.warn("视频结果无法处理，可能需要重新检查状态");
              if (onRetry) {
                setTimeout(() => {
                  console.log("自动重新检查状态");
                  onRetry();
                }, 2000);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching video result:", error);

          // 网络错误也可以考虑重试
          if (onRetry) {
            setTimeout(() => {
              console.log("获取视频结果出错，自动重新检查状态");
              onRetry();
            }, 3000);
          }
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
    onRetry,
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

  // 格式化时间显示（分:秒）
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

  // 获取状态描述文本（基于剩余时间）
  const getStatusDescription = () => {
    if (!isProcessing) {
      switch (generation.status) {
        case "COMPLETED":
        case "SAVED_TO_R2":
          return "Video generation completed!";
        case "FAILED":
          return "Video generation failed";
        default:
          return "Processing...";
      }
    }

    const formattedRemainingTime = formatTime(remainingSeconds);

    switch (generation.status) {
      case "submitted":
        return `Task submitted, estimated time remaining: ${formattedRemainingTime}`;
      case "IN_QUEUE":
        return `Task in queue, estimated time remaining: ${formattedRemainingTime}`;
      case "IN_PROGRESS":
        return `Generating video, estimated time remaining: ${formattedRemainingTime}`;
      default:
        return `Processing, estimated time remaining: ${formattedRemainingTime}`;
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${generation.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleViewHistory = () => {
    router.push("/history");
  };

  return (
    <Card className={cn("p-6 space-y-6 bg-card border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <status.icon
              className={cn(
                "h-5 w-5 text-white",
                status.icon === Loader2 && "animate-spin"
              )}
            />
            <Badge className={cn(status.color, "text-white")}>
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewHistory}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            View History
          </Button>
          {onRetry && isFailed && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* 成功消息 - 放在Prompt上面，只在成功且有视频时显示 */}
      {isCompleted && videoUrl && !isFailed && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-foreground">
            🎉 Your video is ready! You can download it or view all your
            creations in the history.
          </span>
        </div>
      )}

      {/* Prompt - 放在视频上面 */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h3 className="font-medium mb-2 text-foreground">Prompt</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
          {generation.prompt}
        </p>
      </div>

      {/* Video Player - 只在成功且有视频URL时显示 */}
      {isCompleted && videoUrl && !isFailed && (
        <div className="space-y-4">
          <>
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-green-500/30">
              <video
                className="w-full h-auto max-h-[600px]"
                controls
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ aspectRatio: generation.aspect_ratio || "16/9" }}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support video playback.
              </video>

              {/* 播放状态指示器 */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <Play className="h-16 w-16 text-white opacity-80" />
                </div>
              )}
            </div>

            {/* 操作选项 - 放在视频下面，简化版 */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(videoUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </>
        </div>
      )}

      {/* Loading Video State - 只在成功但还在加载视频时显示 */}
      {isCompleted && !videoUrl && isLoadingVideo && !isFailed && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="font-medium text-foreground">Loading Video</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Video generation is completed. Fetching video URL...
          </p>
        </div>
      )}

      {/* Video Not Available State - 只在成功但视频不可用时显示 */}
      {isCompleted && !videoUrl && !isLoadingVideo && !isFailed && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="font-medium text-foreground">
              Video Processing
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Video generation is completed but the video is not available yet.
            Please wait a moment.
          </p>
        </div>
      )}

      {/* Progress Bar (for processing states) */}
      {isProcessing && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Generation Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressValue)}%
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {getStatusDescription()}
          </p>
        </div>
      )}

      {/* Error Message - 只在失败时显示 */}
      {isFailed && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-foreground">
              Generation Failed
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getFriendlyErrorMessage(generation.error_message)}
          </p>
        </div>
      )}
    </Card>
  );
}
