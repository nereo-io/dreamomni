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
import { imagePollingService } from "@/services/imagePollingService";
import type { ImageGenerationHistoryItem } from "@/types/image";

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
  
  // Incomplete statuses now defined in imagePollingService config
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

  // Removed hasIncompleteImages - now handled by imagePollingService

  // Removed updateLatestImageStatus - now handled by imagePollingService

  // 删除图片功能 - 与 My Creations 保持一致
  const onDeleteImage = async (imageId: string, prompt: string) => {
    try {
      console.log(`🗑️ Attempting to delete image: ${imageId}`);
      
      const response = await fetch("/api/image-generations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      });

      console.log("Delete API raw response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      console.log("Delete API parsed result:", result);

      // 检查响应格式
      if (typeof result !== 'object' || result === null) {
        console.error("Invalid result format - not an object:", result);
        throw new Error("Invalid response format");
      }

      if (response.ok && result.code === 0) {
        console.log("✅ Delete successful, updating UI");
        // 从列表中移除已删除的图片
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        
        // 强制刷新历史记录以确保数据一致性
        setTimeout(() => {
          console.log("🔄 Refreshing history after delete to ensure consistency");
          fetchHistory();
        }, 500);
      } else {
        console.error("Delete failed - Conditions not met:", {
          responseOk: response.ok,
          resultCode: result.code,
          resultMessage: result.message
        });
        throw new Error(result.message || `Delete failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete image";
      throw error; // 重新抛出错误，让UI组件处理
    }
  };

  // Removed updateActiveTasksInBackground - now handled by imagePollingService

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

          // Background task updates now handled by imagePollingService in useEffect
          
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

  // 使用轮询服务管理图片状态更新
  const pollingIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!user?.uuid || images.length === 0) {
      return;
    }

    // 停止之前的轮询
    if (pollingIdRef.current) {
      imagePollingService.stopPolling(pollingIdRef.current);
    }

    // 检查是否有需要轮询的图片
    const now = Date.now();
    const maxDuration = 5 * 60 * 1000; // 5分钟
    const incompleteStatuses = ['pending', 'prompt_optimizing', 'in_queue', 'in_progress'];
    
    const hasActiveImages = images.some(img => {
      const statusLower = img.status.toLowerCase();
      if (!incompleteStatuses.includes(statusLower)) {
        return false;
      }
      
      // 检查是否在5分钟内创建
      const createdTime = new Date(img.created_at).getTime();
      return (now - createdTime) < maxDuration;
    });

    if (!hasActiveImages) {
      console.log('没有需要轮询的活跃图片');
      return;
    }

    // 转换类型以符合服务接口
    const imagesToPoll = images as unknown as ImageGenerationHistoryItem[];
    
    // 启动轮询
    const pollingId = imagePollingService.startPolling(
      imagesToPoll,
      {
        onUpdate: (updates) => {
          // 批量更新图片状态
          setImages(prevImages => {
            const newImages = [...prevImages];
            updates.forEach(update => {
              const index = newImages.findIndex(img => img.id === update.id);
              if (index !== -1) {
                newImages[index] = { ...newImages[index], ...update.data } as ImageGenerationResult;
              }
            });
            return newImages;
          });
          console.log(`更新了 ${updates.length} 张图片状态`);
        },
        onTimeout: (image) => {
          // 处理超时的图片
          setImages(prevImages => 
            prevImages.map(img => 
              img.id === image.id 
                ? { ...img, status: 'failed', error_message: '生成超时（超过5分钟）' } as ImageGenerationResult
                : img
            )
          );
          console.log(`图片 ${image.id} 生成超时`);
        },
        onComplete: (image) => {
          console.log(`图片 ${image.id} 生成完成，状态: ${image.status}`);
        },
        onError: (error, imageId) => {
          console.error(`更新图片 ${imageId} 状态时出错:`, error);
        }
      },
      {
        interval: 3000,           // 3秒轮询间隔
        maxDuration: maxDuration, // 5分钟超时
        incompleteStatuses: incompleteStatuses
      }
    );

    pollingIdRef.current = pollingId;

    return () => {
      if (pollingIdRef.current) {
        imagePollingService.stopPolling(pollingIdRef.current);
        pollingIdRef.current = null;
      }
    };
  }, [user?.uuid, images]);

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
