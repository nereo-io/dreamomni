"use client";

import { useState, useEffect } from "react";
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
  onNewGeneration?: () => void;
  className?: string;
}

const STATUS_MAP = {
  submitted: { label: "已提交", color: "bg-blue-500", icon: Clock },
  IN_QUEUE: { label: "排队中", color: "bg-yellow-500", icon: Clock },
  IN_PROGRESS: { label: "生成中", color: "bg-orange-500", icon: Loader2 },
  COMPLETED: { label: "已完成", color: "bg-green-500", icon: CheckCircle },
  SAVED_TO_R2: { label: "已完成", color: "bg-green-500", icon: CheckCircle },
  FAILED: { label: "失败", color: "bg-red-500", icon: XCircle },
};

export default function VideoResult({
  generation,
  onRetry,
  onNewGeneration,
  className,
}: VideoResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // 模拟进度条（实际应用中可以从API获取真实进度）
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 2000);

      return () => clearInterval(interval);
    } else if (isCompleted) {
      setProgress(100);
    }
  }, [isProcessing, isCompleted]);

  const handleDownload = async () => {
    if (!generation.video_url) return;

    try {
      const response = await fetch(generation.video_url);
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
      console.error("下载失败:", error);
    }
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
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
          <span className="text-sm text-muted-foreground">
            {generation.model}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && isFailed && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          )}
          {onNewGeneration && (
            <Button variant="outline" size="sm" onClick={onNewGeneration}>
              新建生成
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <h3 className="font-medium mb-2">提示词</h3>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          {generation.prompt}
        </p>
      </div>

      {/* Progress Bar (for processing states) */}
      {isProcessing && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">生成进度</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            视频生成通常需要 1-3 分钟，请耐心等待...
          </p>
        </div>
      )}

      {/* Error Message */}
      {isFailed && generation.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-800">生成失败</span>
          </div>
          <p className="text-sm text-red-700">{generation.error_message}</p>
        </div>
      )}

      {/* Video Player */}
      {isCompleted && generation.video_url && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">生成结果</span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载视频
            </Button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              className="w-full"
              controls
              poster="/video-placeholder.png"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={generation.video_url} type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>
          </div>

          {/* Video Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>比例: {generation.aspect_ratio || "16:9"}</span>
              <span>时长: {generation.duration_seconds || 5}秒</span>
            </div>
            {generation.created_at && (
              <span>
                创建时间: {new Date(generation.created_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
