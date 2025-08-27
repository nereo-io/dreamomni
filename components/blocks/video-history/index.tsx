"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RefreshCw, History, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import { useAppContext } from "@/contexts/app";
import { useIsMobile } from "@/hooks/use-mobile";
import { getStatusMap, INCOMPLETE_STATUSES } from "./components/constants";
import VideoHistoryItem from "./components/VideoHistoryItem";
import VideoShowcase from "../video-showcase";
import type { ShowcaseVideo } from "@/types/showcase";

interface VideoHistoryProps {
  refreshTrigger?: number;
  className?: string;
  selectedModel?: string;
  mode?: "text-to-video" | "image-to-video";
  onSelectShowcaseVideo?: (
    prompt: string,
    aspectRatio: string,
    duration: number,
    model?: string,
    imageUrl?: string
  ) => void;
  // New props for edit/regenerate functionality
  onEditVideo?: (generation: VideoGenerationResult) => void;
  onRegenerateVideo?: (generation: VideoGenerationResult) => void;
  // Custom showcase data for effect preview
  showcaseData?: any;
}

export default function VideoHistory({
  refreshTrigger,
  className,
  selectedModel,
  mode,
  onSelectShowcaseVideo,
  onEditVideo,
  onRegenerateVideo,
  showcaseData,
}: VideoHistoryProps) {
  const t = useTranslations("video-result");
  const { fetchHistory, history, isLoadingHistory, setHistory } =
    useVideoGeneration();
  const { user, setShowSignModal } = useAppContext();
  const isMobile = useIsMobile();
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // 客户端检测
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 决定是否显示 VideoShowcase
  // 优先显示历史记录：如果用户已登录且有历史记录，显示历史
  // 只有在用户未登录或无历史记录时，才显示showcase
  const shouldShowShowcase = !user?.uuid || history.length === 0;

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
    return INCOMPLETE_STATUSES.includes(latestVideo.status);
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
          setHistory((prevHistory) =>
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

  // Handle showcase video selection
  const handleShowcaseVideoSelect = (video: ShowcaseVideo) => {
    if (onSelectShowcaseVideo) {
      // Parse aspect ratio to match form format
      const aspectRatio = video.aspectRatio.replace(":", ":");
      onSelectShowcaseVideo(video.prompt, aspectRatio, video.duration, video.model, video.imageUrl);
    }
  };

  // Show VideoShowcase for users without video history
  if (shouldShowShowcase) {
    return (
      <div
        className={cn(
          "bg-gray-800 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]",
          className
        )}
      >
        {/* Header */}
        <header className="py-3 px-4 md:px-5 flex justify-between items-center border-b border-gray-700">
          <div className="text-lg md:text-xl font-semibold flex items-center text-white">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
            <span className="truncate">Explore Examples</span>
          </div>
        </header>

        {/* Showcase Content - No overflow, full height */}
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6">
          <VideoShowcase 
          mode={mode} 
          onSelectVideo={handleShowcaseVideoSelect}
          showcaseData={showcaseData}
        />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-gray-800 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]",
        className
      )}
    >
      {/* Header */}
      <header className="py-3 px-4 md:px-5 flex justify-between items-center border-b border-gray-700">
        <div className="text-lg md:text-xl font-semibold flex items-center text-white min-w-0">
          <History className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" />
          <span className="truncate">Recent Generations</span>
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
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No video generations yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Your generated videos will appear here
          </p>
        </div>
      ) : (
        <div className="lg:flex-1 lg:overflow-y-auto video-history-scroll lg:dark-scrollbar">
          <div className="divide-y divide-gray-700">
            {(isMobile ? [...history] : [...history].reverse()).map(
              (generation) => (
                <VideoHistoryItem
                  key={generation.id}
                  generation={generation}
                  statusMap={STATUS_MAP}
                  isExpanded={expandedPrompts.has(generation.id)}
                  onToggleExpanded={() => togglePromptExpansion(generation.id)}
                  onDownload={handleDownload}
                  isExample={false}
                  isClient={isClient}
                  onEdit={onEditVideo}
                  onRegenerate={onRegenerateVideo}
                  canEdit={true} // Always true for real videos
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
