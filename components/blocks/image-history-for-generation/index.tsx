"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import ImageHistoryItem from "./components/ImageHistoryItem";
import ImageHistorySkeleton from "./components/ImageHistorySkeleton";
import ImagePreviewModal from "./components/ImagePreviewModal";
import type { ImageGenerationResult } from "@/components/blocks/image-history";
import { imagePollingService } from "@/services/imagePollingService";
import type { ImageGenerationHistoryItem } from "@/types/image";
import {
  PromptInspirationGallery,
  type PromptInspirationItem,
} from "@/components/blocks/ai-image-generation-tool/PromptInspirationGallery";

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [userStateConfirmed, setUserStateConfirmed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pollingImages, setPollingImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [scrollToBottomFlag, setScrollToBottomFlag] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Featured images state
  const [featuredImages, setFeaturedImages] = useState<PromptInspirationItem[]>(
    []
  );
  const [featuredLoading, setFeaturedLoading] = useState(false);

  // Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    prompt: string;
    index: number;
  } | null>(null);

  // Get all available image URLs from history (including Agent mode multiple images)
  const getAllImageUrls = useCallback(() => {
    const allUrls: Array<{ url: string; prompt: string; imageId: string }> = [];

    images.forEach((image) => {
      if (image.status === "completed" || image.status === "saved_to_r2") {
        // Agent 模式：多张图片
        if (
          image.is_agent_mode &&
          (image.image_urls_r2?.length || image.image_urls?.length)
        ) {
          const urls = image.image_urls_r2?.length
            ? image.image_urls_r2
            : image.image_urls!;
          urls.forEach((url, idx) => {
            allUrls.push({
              url,
              prompt: `${image.prompt} (${idx + 1}/${urls.length})`,
              imageId: image.id,
            });
          });
        }
        // 普通模式：单张图片
        else if (image.image_url_r2 || image.image_url) {
          allUrls.push({
            url: image.image_url_r2 || image.image_url!,
            prompt: image.prompt,
            imageId: image.id,
          });
        }
      }
    });

    return allUrls;
  }, [images]);

  const { user, setShowSignModal } = useAppContext();
  const { status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState<"discovery" | "history" | null>(
    null
  );
  const [hasUserSelectedTab, setHasUserSelectedTab] = useState(false);
  const defaultTabSetRef = useRef(false);

  // Incomplete statuses now defined in imagePollingService config
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("imageHistory");

  // 自动滚动到底部，与视频历史保持一致的实现方式
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
              scrollAreaRef.current.scrollHeight;
          }
        }, 0);
      });
    }
  }, []);

  // Fetch featured images for discovery
  const fetchFeaturedImages = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode) {
        // 映射前端 mode 到数据库 mode
        const apiMode = mode === "image-to-image" ? "image-edit" : mode;
        params.append("mode", apiMode);
      }
      params.append("limit", "25");

      const response = await fetch(`/api/image-generations/featured?${params}`);
      const data = await response.json();

      if (data.code === 0 && Array.isArray(data.data)) {
        const transformedItems: PromptInspirationItem[] = data.data.map(
          (item: any) => ({
            id: item.id,
            title: item.title,
            prompt: item.prompt,
            imageUrl: item.imageUrl,
            inputImageUrl: item.inputImageUrl,
            aspectRatio: item.aspectRatio,
            model: item.model,
          })
        );
        setFeaturedImages(transformedItems);
      }
    } catch (error) {
      console.error("Failed to fetch featured images:", error);
      // 加载失败时使用空数组
      setFeaturedImages([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, [mode]);

  // Removed hasIncompleteImages - now handled by imagePollingService

  // Removed updateLatestImageStatus - now handled by imagePollingService

  // 删除图片功能 - 与 My Creations 保持一致
  const onDeleteImage = async (imageId: string, prompt: string) => {
    try {
      const response = await fetch("/api/image-generations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Invalid response format from server");
      }

      // 检查响应格式
      if (typeof result !== "object" || result === null) {
        throw new Error("Invalid response format");
      }

      if (response.ok && result.code === 0) {
        // 从列表中移除已删除的图片，不需要重新获取整个列表
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== imageId)
        );
      } else {
        throw new Error(
          result.message || `Delete failed: HTTP ${response.status}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete image";
      throw error; // 重新抛出错误，让UI组件处理
    }
  };

  // Removed updateActiveTasksInBackground - now handled by imagePollingService

  // 创建代理下载 URL - 绕过 CORS
  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-image?url=${encodeURIComponent(
      sourceUrl
    )}&filename=${encodeURIComponent(filename)}`;

  const triggerDownload = (href: string, filename: string) => {
    const downloadLink = document.createElement("a");
    downloadLink.href = href;
    downloadLink.download = filename;
    downloadLink.rel = "noopener noreferrer";
    downloadLink.style.cssText =
      "display: none; position: absolute; top: -9999px; left: -9999px;";

    document.body.appendChild(downloadLink);

    try {
      downloadLink.click();
    } finally {
      document.body.removeChild(downloadLink);
    }
  };

  // 下载图片功能 - 与视频历史保持一致
  const handleDownload = async (image: ImageGenerationResult) => {
    const imageUrl = image.image_url_r2 || image.image_url;

    if (!imageUrl) {
      console.error("No image URL available for download");
      toast.error("Image not available for download");
      return;
    }

    // 生成文件名
    const safePrompt = image.prompt
      .substring(0, 20)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");
    const urlParts = imageUrl.split(".");
    const extension =
      urlParts[urlParts.length - 1]?.split("?")[0]?.toLowerCase() || "png";
    const filename = `${safePrompt}_${image.id}.${extension}`;

    const proxyUrl = createProxyDownloadUrl(imageUrl, filename);

    // 立即设置下载状态，显示加载动画
    setDownloadingId(image.id);

    // 确保加载动画至少显示1.5秒
    const minimumSpinnerDelay = new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    try {
      console.log("🔽 Starting image download via proxy:", imageUrl);

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Empty image blob");
      }

      const objectUrl = window.URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      window.URL.revokeObjectURL(objectUrl);

      console.log("✅ Image download successful");
      toast.success("Image downloaded");
    } catch (error) {
      console.error("💥 Proxy download failed, trying fallback:", error);

      // 失败后尝试直接下载（可能被 CORS 阻止）
      try {
        triggerDownload(proxyUrl, filename);
      } catch (fallbackError) {
        console.error("💥 Fallback download failed:", fallbackError);
        triggerDownload(imageUrl, filename);
      }
    } finally {
      // 确保加载动画显示足够时间
      await minimumSpinnerDelay;
      setDownloadingId((current) => (current === image.id ? null : current));
    }
  };

  // Handle image click
  const handleImageClick = useCallback(
    (imageUrl: string, prompt: string) => {
      const allUrls = getAllImageUrls();
      const index = allUrls.findIndex((img) => img.url === imageUrl);

      setPreviewImage({
        url: imageUrl,
        prompt,
        index: index >= 0 ? index : 0,
      });
      setPreviewModalOpen(true);
    },
    [getAllImageUrls]
  );

  // Navigate to previous image
  const handlePreviousImage = useCallback(() => {
    if (!previewImage) return;

    const allUrls = getAllImageUrls();
    const newIndex = previewImage.index - 1;

    if (newIndex >= 0 && newIndex < allUrls.length) {
      setPreviewImage({
        url: allUrls[newIndex].url,
        prompt: allUrls[newIndex].prompt,
        index: newIndex,
      });
    }
  }, [previewImage, getAllImageUrls]);

  // Navigate to next image
  const handleNextImage = useCallback(() => {
    if (!previewImage) return;

    const allUrls = getAllImageUrls();
    const newIndex = previewImage.index + 1;

    if (newIndex >= 0 && newIndex < allUrls.length) {
      setPreviewImage({
        url: allUrls[newIndex].url,
        prompt: allUrls[newIndex].prompt,
        index: newIndex,
      });
    }
  }, [previewImage, getAllImageUrls]);

  // Fetch image history
  const fetchHistory = async () => {
    if (!userId) {
      console.log("📝 No userId provided, skipping fetchHistory");
      setImages([]);
      setInitialLoadComplete(true);
      return;
    }

    console.log("🔄 Fetching image history for userId:", userId);

    try {
      const response = await fetch("/api/image-generations/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.code === 0 && data.data) {
          // 处理新的嵌套数据结构：data.data.data 和 data.data.pagination
          const imageData = Array.isArray(data.data.data) ? data.data.data : [];

          // 显示所有类型的图片，不进行过滤
          const allData = imageData;

          // 数据库返回的是按创建时间倒序排列（最新的在前）
          // 为了在UI中实现"最新的在底部"的效果，我们需要反转数组
          // 这样最新的内容就会在数组的最后，显示在底部
          const reversedData = [...allData].reverse();

          setImages(reversedData);

          // 标记初次加载完成
          setInitialLoadComplete(true);

          // Background task updates now handled by imagePollingService in useEffect

          // 滚动到底部显示最新内容
          setScrollToBottomFlag(true);
        } else {
          console.error("❌ Invalid response format:", data);
          setImages([]);
          setInitialLoadComplete(true);
        }
      } else {
        console.error(
          "❌ Failed to fetch image history:",
          response.status,
          response.statusText
        );
        setImages([]);
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("❌ Error fetching image history:", error);
      setImages([]);
      setInitialLoadComplete(true);
    }
  };

  // Initial load
  useEffect(() => {
    // 1. 如果认证状态未知，等待
    if (sessionStatus === "loading") {
      return;
    }

    // 2. 如果已认证但 userId 还未传入（可能是 props 延迟），继续等待
    if (sessionStatus === "authenticated" && userId === undefined) {
      return;
    }

    // 3. 现在可以确定用户状态了
    setUserStateConfirmed(true);

    if (userId) {
      // 有 userId，加载历史
      fetchHistory();
    } else {
      // 确定没有 userId（未登录或明确为 null），设置初始化完成
      setImages([]);
      setInitialLoadComplete(true);
    }
  }, [userId, sessionStatus]);

  // Fetch featured images when discovery tab is active
  useEffect(() => {
    if (activeTab === "discovery") {
      fetchFeaturedImages();
    }
  }, [activeTab, fetchFeaturedImages]);

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
      setImages((prev) => [
        ...prev.filter((img) => img.id !== newImage.id),
        newImage,
      ]);
      // 新图片添加后自动滚动到底部
      setScrollToBottomFlag(true);
    }
  }, [newImage]);

  // 自动滚动到底部显示最新内容，与视频历史保持一致
  useEffect(() => {
    // 必须等待 activeTab 切换到 history 后，scrollAreaRef 才会绑定到 DOM
    if (scrollToBottomFlag && images.length > 0 && activeTab === "history") {
      // 使用双重延迟确保 DOM 完全渲染后再滚动
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
              scrollAreaRef.current.scrollHeight;
            setScrollToBottomFlag(false);
          }
        }, 0);
      });
    }
  }, [scrollToBottomFlag, images, activeTab]);

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
    const maxDuration = 10 * 60 * 1000; // 5分钟
    const incompleteStatuses = [
      "pending",
      "prompt_optimizing",
      "in_queue",
      "in_progress",
    ];

    const hasActiveImages = images.some((img) => {
      const statusLower = img.status.toLowerCase();
      if (!incompleteStatuses.includes(statusLower)) {
        return false;
      }

      // 检查是否在5分钟内创建
      const createdTime = new Date(img.created_at).getTime();
      return now - createdTime < maxDuration;
    });

    if (!hasActiveImages) {
      // 没有需要轮询的图片
      return;
    }

    // 转换类型以符合服务接口
    const imagesToPoll = images as unknown as ImageGenerationHistoryItem[];

    // 启动轮询
    const pollingId = imagePollingService.startPolling(
      imagesToPoll,
      {
        onUpdate: (updates) => {
          // 批量更新图片状态，保留 Agent 模式关键字段
          setImages((prevImages) => {
            const newImages = [...prevImages];
            updates.forEach((update) => {
              const index = newImages.findIndex((img) => img.id === update.id);
              if (index !== -1) {
                const existing = newImages[index];
                const updateData =
                  update.data as Partial<ImageGenerationResult>;

                // 合并更新，确保 Agent 模式字段不丢失
                newImages[index] = {
                  ...existing,
                  ...updateData,
                  // 保留 Agent 模式关键字段（如果轮询返回未包含则保留原值）
                  is_agent_mode:
                    updateData.is_agent_mode ?? existing.is_agent_mode,
                  agent_image_count:
                    updateData.agent_image_count ?? existing.agent_image_count,
                  expanded_prompts:
                    updateData.expanded_prompts ?? existing.expanded_prompts,
                  // 合并 image_urls_r2（优先使用新数据，否则保留原值）
                  image_urls_r2:
                    updateData.image_urls_r2 &&
                    updateData.image_urls_r2.length > 0
                      ? updateData.image_urls_r2
                      : existing.image_urls_r2,
                } as ImageGenerationResult;
              }
            });
            return newImages;
          });
        },
        onTimeout: (image) => {
          // 处理超时的图片
          setImages((prevImages) => {
            const newImages = prevImages.map((img) =>
              img.id === image.id
                ? ({
                    ...img,
                    status: "failed",
                    error_message: "Generation timed out (over 5 minutes)",
                  } as ImageGenerationResult)
                : img
            );

            return newImages;
          });
        },
        onComplete: (image) => {
          // Image generation completed
          console.log(`Image ${image.id} generation completed`);
        },
        onError: (error, imageId) => {
          console.error(`Error updating image ${imageId}:`, error);
        },
      },
      {
        interval: 3000, // 3秒轮询间隔
        maxDuration: maxDuration, // 5分钟超时
        incompleteStatuses: incompleteStatuses,
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
  useEffect(() => {
    if (!user?.uuid) {
      setHasUserSelectedTab(false);
      defaultTabSetRef.current = false;
    }
  }, [user?.uuid]);

  useEffect(() => {
    if (hasUserSelectedTab) {
      return;
    }

    if (sessionStatus === "loading") {
      defaultTabSetRef.current = false;
      if (activeTab !== null) {
        setActiveTab(null);
      }
      return;
    }

    if (sessionStatus === "unauthenticated") {
      if (!defaultTabSetRef.current || activeTab !== "discovery") {
        setActiveTab("discovery");
      }
      defaultTabSetRef.current = true;
      return;
    }

    if (sessionStatus !== "authenticated") {
      return;
    }

    if (!initialLoadComplete) {
      return;
    }

    const desiredTab = images.length > 0 ? "history" : "discovery";

    if (!defaultTabSetRef.current || activeTab !== desiredTab) {
      setActiveTab(desiredTab);
    }

    defaultTabSetRef.current = true;
  }, [
    sessionStatus,
    initialLoadComplete,
    images.length,
    hasUserSelectedTab,
    activeTab,
  ]);

  const handleTabChange = (tab: "discovery" | "history") => {
    setActiveTab(tab);
    setHasUserSelectedTab(true);
  };

  const renderSignInCard = () => (
    <div className="rounded-xl border border-gray-700/80 bg-gray-900/70 p-6 text-center shadow-md">
      <Sparkles className="mx-auto mb-4 h-12 w-12 text-blue-400" />
      <h3 className="text-xl font-semibold text-gray-100 mb-2">
        {t("pleaseSignIn")}
      </h3>
      <p className="text-sm text-gray-400 mb-5">{t("signInToViewImages")}</p>
      <Button
        onClick={() => setShowSignModal(true)}
        size="lg"
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        {t("signInButton")}
      </Button>
    </div>
  );

  const discoveryContent = (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:dark-scrollbar">
        {featuredLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading featured images...</p>
            </div>
          </div>
        ) : featuredImages.length > 0 ? (
          <div className="space-y-6">
            <PromptInspirationGallery
              items={featuredImages}
              onSelect={(item) => {
                // 对于图生图模式，传递输入图片URL
                if (mode === "image-to-image" && item.inputImageUrl) {
                  onSelectShowcaseImage?.(
                    item.prompt,
                    item.aspectRatio || "",
                    item.model,
                    item.inputImageUrl
                  );
                } else {
                  onSelectShowcaseImage?.(
                    item.prompt,
                    item.aspectRatio || "",
                    item.model,
                    item.imageUrl
                  );
                }
              }}
              showPromptText={false}
              showTitle
              showHeader={false}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-2">
                No featured images yet
              </p>
              <p className="text-sm text-gray-500">
                Check back later for inspiring creations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const historyContent = (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 1. 用户状态未确定或数据未加载完成：显示骨架 */}
      {!userStateConfirmed || !initialLoadComplete ? (
        <ImageHistorySkeleton />
      ) : /* 2. 用户状态已确定且数据加载完成，根据实际情况显示内容 */
      !userId ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">{renderSignInCard()}</div>
        </div>
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
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto image-history-scroll lg:dark-scrollbar"
        >
          <div className="divide-y divide-gray-700">
            {(isMobile ? [...images].reverse() : images).map((image) => (
              <ImageHistoryItem
                key={image.id}
                image={image}
                pollingImages={pollingImages}
                isExpanded={false}
                onToggleExpanded={() => {}}
                onEdit={onEditImage}
                onRegenerate={onRegenerateImage}
                onDelete={onDeleteImage}
                onImageClick={handleImageClick}
                onDownload={handleDownload}
                isDownloading={downloadingId === image.id}
                canEdit={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      id: "discovery" as const,
      label: t("discoveryTab"),
      icon: Sparkles,
    },
    {
      id: "history" as const,
      label: t("historyTab"),
      icon: History,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]",
        className
      )}
    >
      <header className="border-b border-gray-800/30">
        <div className="px-6 pt-4">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2.5 pb-3 text-lg font-semibold transition-all duration-300 ease-out",
                    isActive
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-white" : "text-current opacity-60"
                    )}
                  />
                  <span className="tracking-wide">{tab.label}</span>
                  {isActive && (
                    <div
                      className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-white rounded-full"
                      style={{
                        animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {activeTab === null ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <ImageHistorySkeleton />
        </div>
      ) : activeTab === "discovery" ? (
        discoveryContent
      ) : (
        historyContent
      )}

      {previewImage && (
        <ImagePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setPreviewImage(null);
          }}
          imageUrl={previewImage.url}
          prompt={previewImage.prompt}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          hasPrevious={previewImage.index > 0}
          hasNext={previewImage.index < getAllImageUrls().length - 1}
          currentIndex={previewImage.index}
          totalImages={getAllImageUrls().length}
        />
      )}
    </div>
  );
}
