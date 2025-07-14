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
import { EXAMPLE_VIDEOS } from "@/data/example-videos";

interface VideoHistoryProps {
  refreshTrigger?: number;
  className?: string;
  selectedModel?: string;
  mode?: "text-to-video" | "image-to-video";
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
  selectedModel,
  mode,
}: VideoHistoryProps) {
  const t = useTranslations("video-result");
  const { fetchHistory, history, isLoadingHistory, setHistory } = useVideoGeneration();
  const { user, setShowSignModal } = useAppContext();
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // 获取要显示的示例视频
  const getExampleVideos = () => {
    if (!selectedModel) return EXAMPLE_VIDEOS.veo; // 默认显示veo3小黄鸡

    // 根据模型ID判断类型
    if (selectedModel.includes("veo") || selectedModel.includes("Veo")) {
      return EXAMPLE_VIDEOS.veo;
    } else {
      return EXAMPLE_VIDEOS.seedance;
    }
  };

  // 决定要显示的视频列表
  const videosToShow =
    !user?.uuid || history.length === 0 ? getExampleVideos() : history;

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

  // 更新最新视频的状态
  const updateLatestVideoStatus = useCallback(async () => {
    if (!history || history.length === 0) return;

    const latestVideo = history[0];
    if (!latestVideo) return;

    try {
      const response = await fetch("/api/video-generation/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: latestVideo.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data) {
          // 更新本地状态
          setHistory(prevHistory => 
            prevHistory.map((video, index) => 
              index === 0 ? { ...video, ...result.data } : video
            )
          );
        }
      }
    } catch (error) {
      console.error("更新视频状态失败:", error);
    }
  }, [history, setHistory]);


  // 轮询机制：当有未完成的视频时，每3秒检查一次状态
  useEffect(() => {
    if (!user?.uuid || !hasIncompleteVideos()) {
      return;
    }

    console.log("Starting polling for incomplete videos...");

    const pollInterval = setInterval(() => {
      console.log("Polling video status...");
      updateLatestVideoStatus();
    }, 3000); // 每3秒轮询一次

    return () => {
      console.log("Stopping polling...");
      clearInterval(pollInterval);
    };
  }, [user?.uuid, hasIncompleteVideos, updateLatestVideoStatus]);

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

  // 动态匹配左侧组件高度 - 仅在移动端使用
  useEffect(() => {
    if (isMobile) {
      const matchHeight = () => {
        const generatorElement = document.querySelector(
          ".video-generator-container"
        );
        if (generatorElement && containerRef.current) {
          const generatorHeight =
            generatorElement.getBoundingClientRect().height;
          containerRef.current.style.height = `${generatorHeight}px`;
        }
      };

      // 初始设置
      setTimeout(matchHeight, 100);

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
    }
  }, [isMobile]);

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
        "bg-gray-800 rounded-xl shadow-lg overflow-hidden",
        // PC端使用屏幕高度，移动端保持auto
        isMobile ? "" : "h-screen",
        className
      )}
      style={{
        height: isMobile ? "auto" : "calc(100vh - 81px)",
        minHeight: "600px",
      }}
    >
      {/* Header */}
      <header className="py-3 px-5 flex justify-between items-center border-b border-gray-700">
        <div className="text-xl font-semibold flex items-center text-white">
          <History className="h-5 w-5 mr-3" />
          Recent Generations
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoadingHistory}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoadingHistory && "animate-spin")}
          />
        </Button>
      </header>

      {isLoadingHistory && history.length === 0 && user?.uuid ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
        </div>
      ) : videosToShow.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No video generations yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Your generated videos will appear here
          </p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto video-history-scroll custom-scrollbar divide-y divide-gray-700"
          style={{
            maxHeight: isMobile ? "calc(100% - 50px)" : "calc(100vh - 141px)",
          }}
        >
          {/* 如果显示的是示例视频，添加提示 */}
          {(!user?.uuid || history.length === 0) && (
            <div className="p-4 bg-blue-900/20 border-b border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>
                  {!user?.uuid
                    ? "Sign in to see your video generations. Here are some examples:"
                    : "Here are some example videos to get you started:"}
                </span>
              </div>
            </div>
          )}

          {[...videosToShow].reverse().map((generation) => {
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
              <div key={generation.id} className="p-5 space-y-4">
                {/* 头部信息：状态 + Prompt + 时间戳 */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge
                      className={cn(
                        "text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0 mt-0.5",
                        isCompleted
                          ? "bg-green-500 text-green-900"
                          : isFailed
                          ? "bg-red-500 text-red-900"
                          : "bg-blue-500 text-blue-900"
                      )}
                    >
                      {status.label}
                    </Badge>
                    <p
                      className="text-base font-bold text-white leading-relaxed flex-1"
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
                  {generation.created_at && (
                    <span className="text-sm text-gray-400 flex-shrink-0 mt-0.5">
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

                {/* 参数标签和模型名称 */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
                  >
                    {generation.aspect_ratio || "adaptive"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
                  >
                    {generation.duration_seconds || 5}s
                  </Badge>
                  {generation.upsample_video_url_veo3 && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-600 text-white text-xs px-2 py-1 rounded border-0"
                    >
                      ↑ HD
                    </Badge>
                  )}
                  <div className="text-gray-300 flex-1 text-sm leading-relaxed">
                    {modelConfig?.displayName || generation.model_id}
                  </div>
                </div>

                {/* Enhanced Prompt 区域 */}
                {generation.optimized_prompt &&
                  generation.optimized_prompt !== generation.prompt && (
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => togglePromptExpansion(generation.id)}
                      >
                        <div className="text-sm font-semibold text-purple-400 flex items-center">
                          <Sparkles className="text-base mr-2 h-4 w-4" />
                          Enhanced Prompt:
                        </div>
                        {expandedPrompts.has(generation.id) ? (
                          <ChevronUp className="text-gray-400 h-5 w-5" />
                        ) : (
                          <ChevronDown className="text-gray-400 h-5 w-5" />
                        )}
                      </div>
                      <p
                        className="mt-2 text-sm text-gray-300"
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
                <div className="w-full mt-4">
                  <div
                    className={cn(
                      "h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 rounded-lg overflow-hidden relative group flex items-center justify-center",
                      isCompleted && videoUrl ? "bg-transparent" : "bg-gray-700"
                    )}
                  >
                    {isCompleted && videoUrl ? (
                      <>
                        <video
                          className="max-w-full max-h-full object-contain rounded-lg"
                          controls
                          preload="auto"
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
                          {!user?.uuid || history.length === 0 ? (
                            // 示例视频不允许下载
                            <div className="bg-black/60 text-white border-none h-8 w-8 p-0 rounded-md flex items-center justify-center">
                              <Download className="h-4 w-4 opacity-50" />
                            </div>
                          ) : (
                            // 真实视频允许下载
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
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700 rounded-lg">
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
      )}
    </div>
  );
}
