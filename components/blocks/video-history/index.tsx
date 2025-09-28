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
import VideoHistorySkeleton from "./components/VideoHistorySkeleton";
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
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(
    null
  );

  // 客户端检测
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 渲染逻辑：
  // 1. 未登录用户：直接显示 showcase (特效 sample 或系统 showcase)
  // 2. 已登录用户：先显示骨架屏，数据加载完成后根据结果显示内容

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

  // 获取所有未完成的视频（限制最多轮询数量）
  const getIncompleteVideos = useCallback(() => {
    if (!history || history.length === 0) return [];

    // 返回所有未完成状态的视频，最多轮询5个（与历史记录获取数量一致）
    const MAX_POLLING_VIDEOS = 5;
    const TEN_MINUTES = 10 * 60 * 1000; // 10分钟毫秒数
    const now = Date.now();

    return history
      .filter(video => {
        // 检查是否未完成
        const isIncomplete = INCOMPLETE_STATUSES.includes(video.status);
        // 检查是否在10分钟内创建
        const createdAt = video.created_at;
        if (!createdAt) return false; // 如果没有创建时间，不轮询
        const isRecent = (now - new Date(createdAt).getTime()) < TEN_MINUTES;
        return isIncomplete && isRecent;
      })
      .slice(0, MAX_POLLING_VIDEOS);
  }, [history]);

  // 检查是否有未完成的视频需要轮询
  const hasIncompleteVideos = useCallback(() => {
    return getIncompleteVideos().length > 0;
  }, [getIncompleteVideos]);

  // 更新所有未完成视频的状态
  const updateIncompleteVideosStatus = useCallback(async () => {
    const incompleteVideos = getIncompleteVideos();
    if (incompleteVideos.length === 0) return;

    console.log(`Updating status for ${incompleteVideos.length} incomplete videos (max 5)...`);

    // 使用串行请求减少服务器压力，每个请求间隔100ms
    const results: Array<{ id: string; data: any }> = [];
    for (const video of incompleteVideos) {
      try {
        const response = await fetch("/api/video-generation/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: video.id }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            results.push({ id: video.id, data: result.data });
          }
        }
        
        // 添加短暂延迟，避免请求过于密集
        if (incompleteVideos.indexOf(video) < incompleteVideos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`更新视频 ${video.id} 状态失败:`, error);
      }
    }
    
    // 批量更新本地状态
    if (results.length > 0) {
      setHistory((prevHistory) =>
        prevHistory.map((video) => {
          const update = results.find(r => r && r.id === video.id);
          return update ? { ...video, ...update.data } : video;
        })
      );
    }
  }, [getIncompleteVideos, setHistory]);

  // 轮询机制：当有未完成的视频时，每3秒检查一次状态
  useEffect(() => {
    if (!user?.uuid || !hasIncompleteVideos()) {
      return;
    }

    console.log("Starting polling for incomplete videos...");

    const pollInterval = setInterval(() => {
      console.log("Polling video status...");
      updateIncompleteVideosStatus();
    }, 3000); // 每3秒轮询一次

    return () => {
      console.log("Stopping polling...");
      clearInterval(pollInterval);
    };
  }, [user?.uuid, hasIncompleteVideos, updateIncompleteVideosStatus]);

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

  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-video?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;

  const triggerDownload = (
    href: string,
    filename: string,
    openInNewTab = false
  ) => {
    const downloadLink = document.createElement("a");
    downloadLink.href = href;
    downloadLink.download = filename;
    downloadLink.rel = "noopener noreferrer";
    downloadLink.style.cssText =
      "display: none; position: absolute; top: -9999px; left: -9999px;";
    downloadLink.target = openInNewTab ? "_blank" : "_self";

    document.body.appendChild(downloadLink);

    try {
      downloadLink.click();
    } finally {
      document.body.removeChild(downloadLink);
    }
  };

  // 下载视频
  const handleDownload = async (videoUrl: string, generationId: string) => {
    setDownloadingVideoId(generationId);

    const filename = `video_${Date.now()}.mp4`;
    const proxyUrl = createProxyDownloadUrl(videoUrl, filename);

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("下载失败");

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Empty video blob");
      }

      const objectUrl = window.URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      window.URL.revokeObjectURL(objectUrl);
      return;
    } catch (error) {
      console.error("下载失败:", error);

      try {
        triggerDownload(proxyUrl, filename, isMobile);
      } catch (fallbackError) {
        console.error("Proxy download fallback failed:", fallbackError);
        triggerDownload(videoUrl, filename, true);
      }
    } finally {
      setDownloadingVideoId(null);
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

  // 未登录用户：直接显示 showcase
  if (!user?.uuid) {
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

  // 已登录用户：数据加载中显示骨架屏
  if (isLoadingHistory) {
    return <VideoHistorySkeleton className={className} />;
  }

  // 已登录用户：无数据时显示 showcase
  if (history.length === 0) {
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

  // 已登录用户：有数据时显示历史记录
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
                onDownload={(url) => handleDownload(url, generation.id)}
                isExample={false}
                isClient={isClient}
                onEdit={onEditVideo}
                onRegenerate={onRegenerateVideo}
                canEdit={true} // Always true for real videos
                isDownloading={downloadingVideoId === generation.id}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
