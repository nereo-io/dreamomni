"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideoModel } from "@/config/video-models";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoHistoryProps {
  refreshTrigger?: number;
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

export default function VideoHistory({
  refreshTrigger,
  className,
}: VideoHistoryProps) {
  const t = useTranslations("video-result");
  const { fetchHistory, history, isLoadingHistory } = useVideoGeneration();
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取视频URL
  const getVideoUrl = (gen: VideoGenerationResult) => {
    return (
      gen.video_url ||
      gen.video_url_r2 ||
      gen.upsample_video_url_veo3 ||
      gen.video_url_veo3 ||
      gen.video_url_volcano ||
      gen.video_url_fal ||
      null
    );
  };

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    await fetchHistory(1, 5);
    // 加载完成后滚动到底部显示最新内容
    setScrollToBottom(true);
  }, [fetchHistory]);

  // 初始加载
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 移除定期刷新 - 依赖状态轮询和事件驱动更新

  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // 当 refreshTrigger 变化时，刷新历史记录
      loadHistory().then(() => {
        setScrollToBottom(true);
      });
    }
  }, [refreshTrigger, loadHistory]);

  // 自动滚动到底部显示最新内容
  useEffect(() => {
    if (scrollToBottom && history.length > 0) {
      const scrollContainer = document.querySelector(".video-history-scroll");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        setScrollToBottom(false);
      }
    }
  }, [scrollToBottom, history]);

  // 动态匹配左侧组件高度
  useEffect(() => {
    const matchHeight = () => {
      const generatorElement = document.querySelector(
        ".video-generator-container"
      );
      if (generatorElement && containerRef.current) {
        const generatorHeight = generatorElement.getBoundingClientRect().height;
        containerRef.current.style.height = `${generatorHeight}px`;
      }
    };

    // 初始设置
    setTimeout(matchHeight, 100); // 给DOM一些时间渲染

    // 监听窗口大小变化
    window.addEventListener("resize", matchHeight);

    // 使用 MutationObserver 监听左侧组件变化
    const generatorElement = document.querySelector(
      ".video-generator-container"
    );
    let observer: MutationObserver | null = null;

    if (generatorElement) {
      observer = new MutationObserver(matchHeight);
      observer.observe(generatorElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    // 定时检查（作为备用）
    const interval = setInterval(matchHeight, 2000);

    return () => {
      window.removeEventListener("resize", matchHeight);
      if (observer) observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    loadHistory();
  };

  // 下载视频
  const handleDownload = async (videoUrl: string) => {
    try {
      // 显示下载进度（可选）
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("下载失败");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("下载失败:", error);
      // 如果fetch失败，尝试传统方式
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `video_${Date.now()}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const STATUS_MAP = getStatusMap(t);

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SAVED_TO_R2":
        return "bg-green-500";
      case "IN_PROGRESS":
      case "IN_QUEUE":
      case "PROMPT_OPTIMIZING":
        return "bg-blue-500";
      case "FAILED":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col",
        className
      )}
      style={{ height: "auto", minHeight: "600px" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Generations
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoadingHistory}
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoadingHistory && "animate-spin")}
          />
        </Button>
      </div>

      {isLoadingHistory && history.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No video generations yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Your generated videos will appear here
          </p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto video-history-scroll custom-scrollbar"
          style={{ maxHeight: "calc(100% - 60px)" }}
        >
          <div className="space-y-6 pr-2">
            {[...history].reverse().map((generation) => {
              console.log(generation);
              // 数据已经通过TypeScript接口定义，包含以下主要字段：
              // id, requestId, model, status, prompt, optimized_prompt,
              // video_url, video_url_r2, video_url_fal, video_url_volcano,
              // video_url_veo3, upsample_video_url_veo3, error_message,
              // created_at, aspect_ratio, duration_seconds

              const videoUrl = getVideoUrl(generation);
              const status =
                STATUS_MAP[generation.status as keyof typeof STATUS_MAP] ||
                STATUS_MAP.submitted;
              const isCompleted =
                generation.status === "COMPLETED" ||
                generation.status === "SAVED_TO_R2";
              const isFailed = generation.status === "FAILED";
              const modelConfig = getVideoModel(generation.model_id);
              const statusColor = getStatusColor(generation.status);

              return (
                <div
                  key={generation.id}
                  className="bg-gray-800 rounded-lg overflow-hidden relative border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  {/* 头部信息：状态指示器 + 模型名称 + 时间戳 */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* 状态指示器 */}
                      <div className="flex items-center gap-2">
                        {/* 状态标签 */}
                        <Badge
                          className={cn(
                            "text-xs px-2 py-1 text-white border-0",
                            isCompleted
                              ? "bg-green-600"
                              : isFailed
                              ? "bg-red-600"
                              : "bg-blue-600"
                          )}
                        >
                          {status.label}
                        </Badge>
                        <span className="text-sm font-medium text-white">
                          {modelConfig?.displayName || generation.model_id}
                        </span>
                      </div>
                    </div>

                    {/* 时间戳 */}
                    {generation.created_at && (
                      <span className="text-xs text-gray-400">
                        {(() => {
                          const date = new Date(generation.created_at);
                          const now = new Date();
                          const diffInHours =
                            (now.getTime() - date.getTime()) / (1000 * 60 * 60);

                          if (diffInHours < 24) {
                            return date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          } else {
                            return date.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            });
                          }
                        })()}
                      </span>
                    )}
                  </div>

                  {/* 参数标签和Prompt描述在同一行 */}
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {/* 左侧：参数标签 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 分辨率标签 */}
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-1 bg-gray-600 text-white border-0"
                        >
                          {generation.aspect_ratio || "16:9"}
                        </Badge>

                        {/* 时长标签 */}
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-1 bg-gray-600 text-white border-0"
                        >
                          {generation.duration_seconds || 5}s
                        </Badge>

                        {/* AI增强标签 */}
                        {generation.optimized_prompt &&
                          generation.optimized_prompt !== generation.prompt && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-1 bg-amber-600 text-white border-0"
                            >
                              ✨ AI增强
                            </Badge>
                          )}

                        {/* 高清版标签 */}
                        {generation.upsample_video_url_veo3 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-blue-600 text-white border-0"
                          >
                            ↑ 高清版
                          </Badge>
                        )}
                      </div>

                      {/* 右侧：Prompt 描述 */}
                      <p
                        className="text-sm text-gray-200 leading-relaxed flex-1 min-w-0"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {generation.prompt}
                      </p>
                    </div>
                  </div>

                  {/* 视频预览区域 */}
                  <div className="p-4">
                    <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative group video-container">
                      {isCompleted && videoUrl ? (
                        <>
                          <video
                            className="w-full h-full object-cover cursor-pointer"
                            preload="metadata"
                            controls
                            muted
                            playsInline
                            onLoadedData={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.currentTime = 0.1; // 显示首帧
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              const video = e.target as HTMLVideoElement;
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                          >
                            <source src={videoUrl} type="video/mp4" />
                          </video>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
                          <status.icon
                            className={cn(
                              "h-8 w-8 text-gray-400 mb-2",
                              status.icon === Loader2 && "animate-spin"
                            )}
                          />
                          <span className="text-xs text-gray-500 text-center px-2">
                            {status.label}
                          </span>
                        </div>
                      )}

                      {/* 下载按钮 */}
                      {isCompleted && videoUrl && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white border-none h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(videoUrl);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 错误信息 */}
                    {isFailed && generation.error_message && (
                      <div className="mt-3 p-3 bg-red-900 bg-opacity-20 rounded-lg border border-red-500 border-opacity-30">
                        <p className="text-xs text-red-300 leading-relaxed">
                          ❌ {generation.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
