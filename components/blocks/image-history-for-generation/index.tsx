"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RefreshCw, History, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageHistoryItem from "./components/ImageHistoryItem";
import ImageHistorySkeleton from "./components/ImageHistorySkeleton";
import type { ImageGenerationResult } from "@/components/blocks/image-history";

interface ImageHistoryForGenerationProps {
  refreshTrigger?: number;
  className?: string;
  selectedModel?: string;
  mode?: "text-to-image" | "image-to-image";
  onSelectShowcaseImage?: (
    prompt: string,
    aspectRatio: string,
    model?: string,
    imageUrl?: string
  ) => void;
  // New props for edit/regenerate functionality
  onEditImage?: (generation: ImageGenerationResult) => void;
  onRegenerateImage?: (generation: ImageGenerationResult) => void;
  // Custom showcase data
  showcaseData?: any;
  userId?: string;
  newImage?: ImageGenerationResult | null;
}

export default function ImageHistoryForGeneration({
  refreshTrigger,
  className,
  selectedModel,
  mode,
  onSelectShowcaseImage,
  onEditImage,
  onRegenerateImage,
  showcaseData,
  userId,
  newImage,
}: ImageHistoryForGenerationProps) {
  
  const [images, setImages] = useState<ImageGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pollingImages, setPollingImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [scrollToBottomFlag, setScrollToBottomFlag] = useState(false);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const { user, setShowSignModal } = useAppContext();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("imageHistory");

  // 自动滚动到底部，与视频历史保持一致的实现方式
  const scrollToBottom = useCallback(() => {
    const scrollContainer = document.querySelector(".image-history-scroll");
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, []);

  // 删除图片功能
  const onDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch("/api/image-generations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      });

      const data = await response.json();
      
      if (response.ok && data.code === 0) {
        // 删除成功，从本地状态中移除该图片
        setImages(prev => prev.filter(img => img.id !== imageId));
        console.log("✅ Image deleted successfully:", imageId);
      } else {
        throw new Error(data.message || "Failed to delete image");
      }
    } catch (error) {
      console.error("❌ Failed to delete image:", error);
      throw error; // 重新抛出错误，让UI组件处理
    }
  };

  // 后台异步更新进行中的任务状态（类似视频历史的处理方式）
  const updateActiveTasksInBackground = useCallback(
    async (images: ImageGenerationResult[]) => {
      const activeStatuses = [
        "pending",
        "in_progress", 
        "in_queue"
      ];

      const allActiveTasks = images.filter(
        (image: ImageGenerationResult) =>
          activeStatuses.includes(image.status)
      );

      if (allActiveTasks.length === 0) {
        return;
      }

      console.log(`后台更新 ${allActiveTasks.length} 个进行中图片的状态...`);

      try {
        // 并行触发状态更新（不阻塞UI）
        const statusPromises = allActiveTasks.map(
          async (image: ImageGenerationResult) => {
            try {
              await fetch("/api/image-generation/status", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: image.id }),
              });
            } catch (error) {
              console.error(`更新图片 ${image.id} 状态失败:`, error);
            }
          }
        );

        await Promise.all(statusPromises);
        console.log(`后台图片状态更新完成`);

        // 静默刷新历史记录以显示最新状态
        const refreshResponse = await fetch(`/api/image-generations/history`);
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.code === 0 && refreshResult.data) {
            const updatedImages = refreshResult.data || [];
            // 与主数据获取逻辑保持一致，反转数组顺序
            const reversedUpdatedImages = [...updatedImages].reverse();
            setImages(reversedUpdatedImages);
            console.log(`图片历史记录已静默更新`);
          }
        }
      } catch (error) {
        console.error("后台图片状态更新失败:", error);
      }
    },
    []
  );

  // Fetch image history
  const fetchHistory = async () => {
    if (!userId) {
      console.log("📝 No userId provided, skipping fetchHistory");
      setImages([]);
      setLoading(false);
      setInitialLoadComplete(true);
      return;
    }

    console.log("🔄 Fetching image history for userId:", userId);
    // 只在初次加载时显示整页loading
    if (!initialLoadComplete) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/image-generations/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.code === 0 && Array.isArray(data.data)) {
          // 显示所有类型的图片，不进行过滤
          const allData = data.data;
          
          // 数据库返回的是按创建时间倒序排列（最新的在前）
          // 为了在UI中实现"最新的在底部"的效果，我们需要反转数组
          // 这样最新的内容就会在数组的最后，显示在底部
          const reversedData = [...allData].reverse();
          
          setImages(reversedData);
          
          // 标记初次加载完成
          setInitialLoadComplete(true);
          
          // 如果没有处理中的图片，立即结束loading
          const hasProcessingImages = reversedData.some((img: ImageGenerationResult) => 
            img.status === "pending" || 
            img.status === "in_progress" || 
            img.status === "in_queue"
          );
          
          if (!hasProcessingImages) {
            setLoading(false);
          }

          // 异步检查并更新进行中的任务状态（不阻塞页面渲染）
          updateActiveTasksInBackground(reversedData);
          
          // 滚动到底部显示最新内容
          setScrollToBottomFlag(true);
        } else {
          console.error("❌ Invalid response format:", data);
          setImages([]);
          setLoading(false);
          setInitialLoadComplete(true);
        }
      } else {
        console.error("❌ Failed to fetch image history:", response.status, response.statusText);
        setImages([]);
        setLoading(false);
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("❌ Error fetching image history:", error);
      setImages([]);
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchHistory().then(() => {
        setScrollToBottomFlag(true);
      });
    }
  }, [refreshTrigger]);

  // Handle new image - 添加到底部
  useEffect(() => {
    if (newImage && newImage.id) {
      setImages(prev => [...prev.filter(img => img.id !== newImage.id), newImage]);
      // 新图片添加后自动滚动到底部
      setScrollToBottomFlag(true);
    }
  }, [newImage]);

  // 自动滚动到底部显示最新内容，与视频历史保持一致
  useEffect(() => {
    if (scrollToBottomFlag && images.length > 0) {
      const scrollContainer = document.querySelector(".image-history-scroll");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        setScrollToBottomFlag(false);
      }
    }
  }, [scrollToBottomFlag, images]);

  // 未登录用户：显示登录提示
  if (!user?.uuid) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "bg-gray-800 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]",
          className
        )}
      >
        <header className="py-3 px-4 md:px-5 flex justify-between items-center border-b border-gray-700">
          <div className="text-lg md:text-xl font-semibold flex items-center text-white min-w-0">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" />
            <span className="truncate">Explore Examples</span>
          </div>
        </header>

        {/* Showcase Content - No overflow, full height */}
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6">
          <div className="text-center py-12">
            <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-200 mb-2">
              {t("pleaseSignIn")}
            </h3>
            <p className="text-gray-400 mb-6">{t("signInToViewImages")}</p>
            <Button
              onClick={() => setShowSignModal(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t("signInButton")}
            </Button>
          </div>
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
          disabled={loading}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw
            className={cn("h-4 w-4", loading && "animate-spin")}
          />
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading && !initialLoadComplete ? (
          <ImageHistorySkeleton />
        ) : images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("noImagesTitle")}
              </h3>
              <p className="text-gray-400 mb-6">{t("noImagesDescription")}</p>
            </div>
          </div>
        ) : (
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6 image-history-scroll lg:dark-scrollbar">
            <div className="space-y-4">
              {images.map((image, index) => (
                <ImageHistoryItem
                  key={image.id}
                  image={image}
                  pollingImages={pollingImages}
                  isExpanded={false}
                  onToggleExpanded={() => {}}
                  onEdit={onEditImage}
                  onRegenerate={onRegenerateImage}
                  onDelete={onDeleteImage}
                  canEdit={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
