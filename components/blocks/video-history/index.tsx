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
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideoModel } from "@/config/video-models";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import { useAppContext } from "@/contexts/app";

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
  const { user, setShowSignModal } = useAppContext();
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle enhanced prompt visibility
  const togglePromptExpansion = (generationId: string) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      return newSet;
    });
  };

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
    if (!user?.uuid) {
      // 用户未登录，不发送请求
      return;
    }
    await fetchHistory(1, 5);
    // 加载完成后滚动到底部显示最新内容
    setScrollToBottom(true);
  }, [fetchHistory, user?.uuid]);

  // 初始加载
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 检查是否有未完成的视频需要轮询
  const hasIncompleteVideos = useCallback(() => {
    if (!history || history.length === 0) return false;

    // 检查最新的视频是否未完成
    const latestVideo = history[0];
    if (!latestVideo) return false;

    // 未完成的状态包括：提交中、优化中、排队中、生成中
    const incompleteStatuses = [
      "submitted",
      "PROMPT_OPTIMIZING",
      "IN_QUEUE",
      "IN_PROGRESS",
    ];
    return incompleteStatuses.includes(latestVideo.status);
  }, [history]);

  // 轮询机制：当有未完成的视频时，每3秒检查一次状态
  useEffect(() => {
    if (!user?.uuid || !hasIncompleteVideos()) {
      return;
    }

    console.log("Starting polling for incomplete videos...");

    const pollInterval = setInterval(() => {
      console.log("Polling video status...");
      loadHistory();
    }, 3000); // 每3秒轮询一次

    return () => {
      console.log("Stopping polling...");
      clearInterval(pollInterval);
    };
  }, [user?.uuid, hasIncompleteVideos, loadHistory]);

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

      {isLoadingHistory && history.length === 0 && user?.uuid ? (
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
          <div className="space-y-4 pr-2">
            {[...history].reverse().map((generation) => {
              console.log("Video generation data:", {
                id: generation.id,
                prompt: generation.prompt,
                optimized_prompt: generation.optimized_prompt,
                has_optimized: !!generation.optimized_prompt,
                is_different: generation.optimized_prompt !== generation.prompt,
              });

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
                  className="bg-gray-800 rounded-lg shadow-lg p-6 text-gray-300 transition-all duration-200 hover:shadow-xl hover:bg-gray-800/90"
                >
                  {/* 头部信息：状态 + 模型名称 + 时间戳 */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={cn(
                          "text-white text-xs font-semibold px-3 py-1 rounded-md border-0",
                          isCompleted
                            ? "bg-green-500"
                            : isFailed
                            ? "bg-red-500"
                            : "bg-blue-500"
                        )}
                      >
                        {status.label}
                      </Badge>
                      <h2 className="text-lg font-bold text-white">
                        {modelConfig?.displayName || generation.model_id}
                      </h2>
                    </div>
                    {generation.created_at && (
                      <span className="text-sm text-gray-400">
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

                  {/* 参数标签和 Prompt 描述 */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-gray-700/50 text-gray-400 text-xs px-3 py-1 rounded-md border-0"
                    >
                      {generation.aspect_ratio || "adaptive"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-gray-700/50 text-gray-400 text-xs px-3 py-1 rounded-md border-0"
                    >
                      {generation.duration_seconds || 5}s
                    </Badge>
                    {generation.upsample_video_url_veo3 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md border-0"
                      >
                        ↑ HD
                      </Badge>
                    )}
                    <p className="text-gray-300 flex-1 text-sm text-white leading-relaxed">
                      {generation.prompt.length > 50
                        ? `${generation.prompt.substring(0, 50)}...`
                        : generation.prompt}
                    </p>
                  </div>

                  {/* Enhanced Prompt 区域 */}
                  {generation.optimized_prompt &&
                    generation.optimized_prompt !== generation.prompt && (
                      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => togglePromptExpansion(generation.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <Sparkles className="text-purple-400 text-xl h-3 w-3" />
                            <span className="text-sm">Enhanced Prompt:</span>
                          </div>
                          {expandedPrompts.has(generation.id) ? (
                            <ChevronUp className="text-gray-400 h-5 w-5" />
                          ) : (
                            <ChevronDown className="text-gray-400 h-5 w-5" />
                          )}
                        </div>
                        <p
                          className="mt-3 text-gray-400 leading-relaxed text-sm text-white"
                          style={
                            expandedPrompts.has(generation.id)
                              ? {}
                              : {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }
                          }
                        >
                          {generation.optimized_prompt}
                        </p>
                      </div>
                    )}

                  {/* 视频播放区域 */}
                  <div className="rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative group">
                      {isCompleted && videoUrl ? (
                        <>
                          <video
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            muted
                            playsInline
                            onLoadedData={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.currentTime = 0.1;
                            }}
                          >
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>

                          {/* 下载按钮 */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-black/60 hover:bg-black/80 text-white border-none h-8 w-8 p-0 rounded-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(videoUrl);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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
                    </div>

                    {/* 错误信息 */}
                    {isFailed && generation.error_message && (
                      <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
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
