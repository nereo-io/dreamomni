"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Download,
  Copy,
  Heart,
  MoreHorizontal,
  Loader2,
  Image,
  ExternalLink,
  Trash2,
  XCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import ImageHistorySkeleton from "./ImageHistorySkeleton";
import ImageMetadata from "./ImageMetadata";
import { getImageModel } from "@/config/image-models";

export interface ImageGenerationResult {
  id: string;
  prompt: string; // 原始用户输入的prompt
  optimized_prompt?: string; // 优化后的prompt
  image_url?: string;
  image_url_r2?: string; // R2存储的URL
  input_image_urls?: string[]; // 输入图片URLs (用于image-to-image)
  status: "pending" | "completed" | "failed" | "in_progress" | "in_queue" | "prompt_optimizing" | "saved_to_r2";
  model: string;
  quality: string;
  style?: string;
  image_size?: string; // 图片尺寸比例 (1:1, 16:9, etc.)
  resolution?: string; // 图片分辨率 (1K, 2K, 4K)
  created_at: string;
  updated_at: string;
  credits_used: number;
  error_message?: string;
}

interface ImageHistoryProps {
  refreshTrigger: number;
  userId?: string;
  newImage?: ImageGenerationResult; // 新生成的图片，立即显示
  filterMode?: "text-to-image" | "image-to-image" | "all"; // 过滤模式
  className?: string; // 允许传递自定义样式
  showEmptyState?: boolean; // 是否显示空状态
}

export default function ImageHistory({ refreshTrigger, userId, newImage, filterMode = "all", className, showEmptyState = false }: ImageHistoryProps) {
  const [images, setImages] = useState<ImageGenerationResult[]>([]);
  const [loading, setLoading] = useState(true); // 只用于初次加载
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Removed pollingImages state - My Creations page only displays history
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  // Removed pollingIntervalsRef - My Creations page only displays history
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 标记初次加载是否完成
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const t = useTranslations("imageHistory");

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 定义未完成的状态，与图片生成页面保持一致
  const INCOMPLETE_STATUSES = [
    "pending",
    "prompt_optimizing", 
    "in_queue",
    "in_progress"
  ];

  // Removed updateActiveTasksInBackground - My Creations page only displays history

  // 图片开始加载
  const handleImageStartLoading = useCallback((imageId: string) => {
    setLoadingImages(prev => new Set(prev).add(imageId));
  }, []);

  // 图片加载完成
  const handleImageLoaded = useCallback((imageId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, []);

  // Removed hasIncompleteImages - My Creations page only displays history

  // Removed updateLatestImageStatus - My Creations page only displays history

  // 检查是否所有关键内容都已加载完成
  const checkAllContentLoaded = useCallback(() => {
    // 只在初次加载时检查loading状态
    if (!initialLoadComplete) {
      const hasProcessingImages = images.some(img => 
        img.status === "pending" || 
        img.status === "in_progress" || 
        img.status === "in_queue"
      );

      // 如果没有处理中的图片，并且没有正在加载的图片，则结束loading
      if (!hasProcessingImages && loadingImages.size === 0) {
        setLoading(false);
      }
    }
  }, [images, loadingImages, initialLoadComplete]);

  // 监听图片加载状态变化
  useEffect(() => {
    checkAllContentLoaded();
  }, [checkAllContentLoaded]);

  // 等待图片加载完成
  const waitForImageLoad = (imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000); // 5秒超时

      img.onload = () => {
        clearTimeout(timeout);
        console.log('✅ First image loaded successfully');
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.warn('⚠️ First image failed to load, but continuing...');
        resolve(); // 即使加载失败也继续，不阻塞界面
      };

      img.src = imageUrl;
    });
  };

  // Fetch image history
  const fetchHistory = async (page: number = 1) => {
    if (!userId) {
      console.log("📝 No userId provided, skipping fetchHistory");
      setImages([]);
      setLoading(false);
      setInitialLoadComplete(true);
      return;
    }

    console.log(`🔄 Fetching image history for userId: ${userId}, page: ${page}`);
    // 只在初次加载时显示整页loading
    if (!initialLoadComplete) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/image-generations/history?page=${page}&limit=20`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 History API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 History API data:", {
          code: data.code,
          dataType: typeof data.data,
          hasData: !!data.data?.data,
          hasPagination: !!data.data?.pagination,
          message: data.message
        });

        if (data.code === 0 && data.data) {
          // 处理新的嵌套数据结构：data.data.data 和 data.data.pagination
          const imageData = Array.isArray(data.data.data) ? data.data.data : [];
          const pagination = data.data.pagination || {};

          // Apply filter based on mode
          let filteredData = imageData;
          if (filterMode !== "all") {
            filteredData = imageData.filter((img: ImageGenerationResult) => {
              if (filterMode === "text-to-image") {
                return img.model === "google/nano-banana";
              } else if (filterMode === "image-to-image") {
                return img.model === "nano-banana-edit";
              }
              return true;
            });
          }

          setImages(filteredData);

          // 更新分页信息
          setCurrentPage(pagination.page || page);
          setTotalPages(pagination.totalPages || 1);
          setTotalItems(pagination.total || 0);
          
          // 重置加载中的图片集合
          setLoadingImages(new Set());
          
          // 标记所有完成的图片为需要加载
          const completedImages = filteredData.filter((img: ImageGenerationResult) => 
            (img.status === "completed" || img.status === "saved_to_r2") && img.image_url
          );
          
          if (completedImages.length > 0) {
            const imageIds = completedImages.map((img: ImageGenerationResult) => img.id);
            setLoadingImages(new Set(imageIds));
            console.log("🖼️ Found completed images to load:", imageIds.length);
          }
          
          // 检查是否需要结束loading状态
          const hasProcessingImages = filteredData.some((img: ImageGenerationResult) => 
            img.status === "pending" || 
            img.status === "in_progress" || 
            img.status === "in_queue"
          );
          
          // 标记初次加载完成
          setInitialLoadComplete(true);
          
          // 如果没有处理中的图片，立即结束loading
          if (!hasProcessingImages) {
            setLoading(false);
          }

          // Removed background task updates - My Creations page only displays history
        } else {
          console.error("❌ Invalid response format:", data);
          setImages([]);
          setLoading(false);
          setInitialLoadComplete(true);
        }
      } else {
        console.error("❌ Failed to fetch image history:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
        setImages([]);
        setLoading(false);
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error("❌ Error fetching image history:", error);
      setImages([]);
      setLoadingImages(new Set()); // 清空加载中的图片
      setLoading(false); // 出错时立即停止loading
      setInitialLoadComplete(true);
    }
  };

  // Removed pollImageStatus - My Creations page only displays history

  // Removed startPollingForProcessingImages - My Creations page only displays history

  // 开始轮询单个图片
  // Removed startPollingImage - My Creations page only displays history

  // Removed stopPollingImage - My Creations page only displays history

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteImages");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem("favoriteImages", JSON.stringify(Array.from(newFavorites)));
    setFavorites(newFavorites);
  };

  // Toggle favorite
  const toggleFavorite = (imageId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageId)) {
      newFavorites.delete(imageId);
      toast.success(t("removedFromFavorites"));
    } else {
      newFavorites.add(imageId);
      toast.success(t("addedToFavorites"));
    }
    saveFavorites(newFavorites);
  };

  // 创建代理下载 URL - 绕过 CORS
  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-image?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;

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

  // Download image to local file system - 与视频下载保持一致
  const downloadImage = async (imageId: string, imageUrl: string, prompt: string) => {
    if (!imageUrl) {
      toast.error("Image not available for download");
      return;
    }

    // 生成文件名
    const safePrompt = prompt.substring(0, 20).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const urlParts = imageUrl.split('.');
    const extension = urlParts[urlParts.length - 1]?.split('?')[0]?.toLowerCase() || 'png';
    const filename = `${safePrompt}_${imageId}.${extension}`;

    const proxyUrl = createProxyDownloadUrl(imageUrl, filename);

    // 立即设置下载状态，显示加载动画
    setDownloadingId(imageId);

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
      toast.success(t("imageDownloaded"));
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
      setDownloadingId((current) =>
        current === imageId ? null : current
      );
    }
  };

  // Copy prompt
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success(t("promptCopied"));
  };

  // Open image in new tab
  const openImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  // Format model display name
  const formatModelDisplayName = (modelName: string): string => {
    switch (modelName) {
      case 'google/nano-banana':
        return t("textToImageModel");
      case 'nano-banana-edit':
        return t("imageToImageModel");
      default:
        return modelName;
    }
  };

  // Delete image
  const deleteImage = async (imageId: string, prompt: string) => {
    if (!confirm(`Are you sure you want to delete this image?\n\nPrompt: ${prompt.slice(0, 100)}...`)) {
      return;
    }

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
        toast.success(t("imageDeleted"));
        
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
      toast.error(t("deleteFailed"));
    }
  };

  // Get status badge
  const getStatusBadge = (status: string, imageId?: string) => {
    const normalizedStatus = status.toLowerCase();
    const isPolling = false; // Polling removed - My Creations page only displays history
    
    switch (normalizedStatus) {
      case "completed":
      case "saved_to_r2":
        return (
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white border-transparent"
          >
            {t("completed")}
          </Badge>
        );
      case "prompt_optimizing":
        return (
          <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white border-transparent">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {t("optimizingPrompt")}
          </Badge>
        );
      case "in_progress":
      case "in_queue":
      case "pending":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {isPolling ? t("processing") : t("processing")}
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">{t("failed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 清理轮询
  useEffect(() => {
    // Cleanup removed - no polling in My Creations page
  }, []);

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchHistory(newPage);
  };

  // Removed polling mechanism - My Creations page is for viewing history only

  useEffect(() => {
    fetchHistory(1); // 始终从第1页开始
  }, [userId, refreshTrigger]);

  // Handle new image - add to top of the list immediately
  useEffect(() => {
    if (newImage && newImage.id) {
      setImages(prevImages => {
        // Check if image already exists to avoid duplicates
        const existingImageIndex = prevImages.findIndex(img => img.id === newImage.id);
        if (existingImageIndex !== -1) {
          // Update existing image
          const updatedImages = [...prevImages];
          updatedImages[existingImageIndex] = newImage;
          return updatedImages;
        } else {
          // Add new image to the top
          const newImages = [newImage, ...prevImages];
          
          // Removed polling - My Creations page only displays history
          
          return newImages;
        }
      });
    }
  }, [newImage]); // Removed startPollingImage dependency

  return (
    <div className={className || "bg-gray-900 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]"}>
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        {loading && !initialLoadComplete ? (
          <ImageHistorySkeleton />
        ) : images.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {!userId ? t("pleaseSignIn") : t("noImagesTitle")}
            </h3>
            <p className="text-gray-400">
              {!userId 
                ? t("signInToView")
                : t("noImagesDescription")
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
          {/* Grid Layout consistent with VideoTab */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => {
                console.log('Rendering image:', {
                  id: image.id,
                  status: image.status,
                  prompt: image.prompt?.slice(0, 50) + '...',
                  hasImage: !!image.image_url
                });
                
                return (
                  <CardImageItem
                    key={image.id}
                    image={image}
                    // pollingImages prop removed
                    favorites={favorites}
                    onDelete={deleteImage}
                    onToggleFavorite={toggleFavorite}
                    onDownload={downloadImage}
                    onOpen={openImage}
                    onCopyPrompt={copyPrompt}
                    getStatusBadge={getStatusBadge}
                    formatModelDisplayName={formatModelDisplayName}
                    onImageStartLoading={handleImageStartLoading}
                    onImageLoaded={handleImageLoaded}
                    downloadingId={downloadingId}
                    t={t}
                  />
                );
              })}
            </div>

            {/* 分页组件 */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                  {(() => {
                    const pageNumbers = [];
                    const maxVisiblePages = 5;

                    if (totalPages <= maxVisiblePages) {
                      // 如果总页数少于或等于最大可见页数，显示所有页码
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else {
                      // 如果总页数大于最大可见页数，智能显示页码
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);

                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(i);
                      }
                    }

                    return pageNumbers.map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          handlePageChange(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Card Image Item Component (consistent with VideoTab style)
interface CardImageItemProps {
  image: ImageGenerationResult;
  // pollingImages removed - no polling in My Creations
  favorites: Set<string>;
  onDelete: (id: string, prompt: string) => void;
  onToggleFavorite: (id: string) => void;
  onDownload: (imageId: string, imageUrl: string, prompt: string) => void;
  onOpen: (imageUrl: string) => void;
  onCopyPrompt: (prompt: string) => void;
  getStatusBadge: (status: string, imageId?: string) => JSX.Element;
  formatModelDisplayName: (modelName: string) => string;
  onImageStartLoading?: (imageId: string) => void;
  onImageLoaded?: (imageId: string) => void;
  downloadingId: string | null;
  t: (key: string, params?: any) => string;
}

const CardImageItem = ({
  image,
  // pollingImages removed
  favorites,
  onDelete,
  onToggleFavorite,
  onDownload,
  onOpen,
  onCopyPrompt,
  getStatusBadge,
  formatModelDisplayName,
  onImageStartLoading,
  onImageLoaded,
  downloadingId,
  t
}: CardImageItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  // Calculate aspect ratio for responsive sizing
  const getImageHeight = () => {
    if (!naturalDimensions) return 'auto';
    const aspectRatio = naturalDimensions.height / naturalDimensions.width;
    return aspectRatio;
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
    
    // 通知父组件图片加载完成
    onImageLoaded?.(image.id);
  };

  // 在组件挂载时，如果有图片URL，通知开始加载
  useEffect(() => {
    if ((image.status === "completed" || image.status === "saved_to_r2") && image.image_url && !imageLoaded) {
      onImageStartLoading?.(image.id);
    }
  }, [image.id, image.status, image.image_url, imageLoaded, onImageStartLoading]);

  return (
    <Card className="bg-gray-700/50 border-gray-700 text-gray-200 flex flex-col hover:bg-gray-700/70 transition-all duration-200">
      <CardHeader className="space-y-3">
        <div className={`w-full h-64 rounded-md flex items-center justify-start overflow-hidden relative ${
          (image.status === "completed" || image.status === "saved_to_r2") && imageLoaded
            ? ''
            : 'bg-gray-700'
        }`}>
          {/* Completed Image */}
          {(image.status === "completed" || image.status === "saved_to_r2") && image.image_url ? (
            <div className="relative w-full h-full group flex items-center justify-start">
              <img
                src={image.image_url}
                alt={image.prompt}
                className={`max-w-full max-h-full object-contain cursor-pointer transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => onOpen(image.image_url!)}
                onLoad={handleImageLoad}
                loading="lazy"
              />

              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-600 animate-pulse flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
              

            </div>
          ) : (image.status === "pending" || image.status === "in_progress" || image.status === "in_queue") ? (
            /* Processing State */
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-300">
                  {image.status === "in_progress" ? t("generatingImage") : t("inQueue")}
                </p>
                {false && ( // Polling indicator removed - no polling in My Creations
                  <div className="flex items-center justify-center mt-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-xs text-blue-400 ml-2">Auto-refreshing</span>
                  </div>
                )}
              </div>
            </div>
          ) : image.status === "failed" ? (
            /* Failed State */
            <div className="w-full h-full bg-red-900/20 border border-red-700/50 flex items-center justify-center">
              <div className="text-center p-4">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400 mb-1">Generation failed</p>
                {image.error_message && (
                  <p className="text-xs text-red-300 line-clamp-2">{image.error_message}</p>
                )}
              </div>
            </div>
          ) : (
            /* Default placeholder */
            <Image className="h-16 w-16 text-gray-500" />
          )}
        </div>
        <div className="flex items-start gap-2">
          <CardTitle className="text-lg truncate flex-1" title={image.prompt}>
            {image.prompt}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopyPrompt(image.prompt)}
            title={t("copyPrompt")}
            className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-200"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Metadata tags - aspect ratio, resolution, and model name */}
        <ImageMetadata
          aspectRatio={image.image_size}
          resolution={image.resolution}
          modelName={getImageModel(image.model)?.displayName || image.model}
        />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-center">
          {getStatusBadge(image.status, image.id)}
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(image.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpen(image.image_url!)}
          disabled={
            image.status !== "completed" &&
            image.status !== "saved_to_r2" &&
            !image.image_url
          }
          className="w-full sm:w-auto border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Open
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(image.id, image.image_url!, image.prompt)}
            disabled={
              downloadingId === image.id ||
              (image.status !== "completed" &&
              image.status !== "saved_to_r2" &&
              !image.image_url)
            }
            title={t("downloadImage")}
            className="text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingId === image.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(image.id, image.prompt)}
            title={t("deleteImage")}
            className="text-gray-400 hover:text-red-400"
          >
            <Trash2 className="h-5 w-5 text-gray-400 hover:text-gray-200" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

