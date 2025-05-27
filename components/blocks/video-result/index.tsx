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

export default function VideoResult({
  generation,
  onRetry,
  onVideoUrlUpdate,
  className,
}: VideoResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(generation.video_url);
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
            }
          } else {
            console.error("Failed to fetch video result:", response.status);
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

  // 根据状态计算进度百分比
  const getProgressValue = () => {
    switch (generation.status) {
      case "submitted":
        return 15;
      case "IN_QUEUE":
        return 30;
      case "IN_PROGRESS":
        return 75;
      case "COMPLETED":
      case "SAVED_TO_R2":
        return 100;
      case "FAILED":
        return 0;
      default:
        return 5;
    }
  };

  const progressValue = getProgressValue();

  // 获取状态描述文本
  const getStatusDescription = () => {
    switch (generation.status) {
      case "submitted":
        return "Task submitted, waiting for processing...";
      case "IN_QUEUE":
        return "Task in queue, will start generating soon...";
      case "IN_PROGRESS":
        return "Generating video, please wait...";
      case "COMPLETED":
      case "SAVED_TO_R2":
        return "Video generation completed!";
      case "FAILED":
        return "Video generation failed";
      default:
        return "Processing...";
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
    <Card className={cn("p-6 space-y-6", className)}>
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

      {/* Video Player - 放在更显眼的位置 */}
      {isCompleted && (
        <div className="space-y-4">
          {videoUrl ? (
            <>
              <div className="flex justify-between items-center">
                {/* <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Video Generated Successfully!
                </h3> */}
                <div className="flex items-center gap-2">
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
              </div>

              <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-green-200">
                <video
                  className="w-full h-auto max-h-[600px]"
                  controls
                  preload="metadata"
                  poster="/video-placeholder.png"
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

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  🎉 Your video is ready! You can download it or view all your
                  creations in the history.
                </p>
              </div>
            </>
          ) : isLoadingVideo ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="font-medium text-blue-800">Loading Video</span>
              </div>
              <p className="text-sm text-blue-700">
                Video generation is completed. Fetching video URL...
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-yellow-800">
                  Video Processing
                </span>
              </div>
              <p className="text-sm text-yellow-700">
                Video generation is completed but the video is not available
                yet. Please wait a moment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prompt */}
      <div>
        <h3 className="font-medium mb-2">Prompt</h3>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          {generation.prompt}
        </p>
      </div>

      {/* Progress Bar (for processing states) */}
      {isProcessing && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Generation Progress</span>
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

      {/* Error Message */}
      {isFailed && generation.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-800">Generation Failed</span>
          </div>
          <p className="text-sm text-red-700">{generation.error_message}</p>
        </div>
      )}
    </Card>
  );
}
