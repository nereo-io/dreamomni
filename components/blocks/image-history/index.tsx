"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Copy, 
  Heart, 
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Image,
  ExternalLink,
  Link,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

export interface ImageGenerationResult {
  id: string;
  prompt: string;
  image_url?: string;
  status: "pending" | "processing" | "completed" | "failed" | "in_progress" | "in_queue" | "saved_to_r2";
  model: string;
  aspect_ratio: string;
  quality: string;
  style?: string;
  created_at: string;
  updated_at: string;
  credits_used: number;
  error_message?: string;
}

interface ImageHistoryProps {
  refreshTrigger: number;
  userId?: string;
  newImage?: ImageGenerationResult; // 新生成的图片，立即显示
}

export default function ImageHistory({ refreshTrigger, userId, newImage }: ImageHistoryProps) {
  const [images, setImages] = useState<ImageGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pollingImages, setPollingImages] = useState<Set<string>>(new Set());
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const t = useTranslations("imageHistory");

  // Fetch image history
  const fetchHistory = async () => {
    if (!userId) {
      setImages([]);
      setLoading(false);
      return;
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
          setImages(data.data);
          // 开始轮询生成中的图片
          startPollingForProcessingImages(data.data);
        } else {
          console.error("Invalid response format:", data);
          setImages([]);
        }
      } else {
        console.error("Failed to fetch image history:", response.status);
        setImages([]);
      }
    } catch (error) {
      console.error("Error fetching image history:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // 轮询单个图片状态
  const pollImageStatus = useCallback(async (imageId: string): Promise<ImageGenerationResult | null> => {
    try {
      const response = await fetch("/api/image-generation/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: imageId }),
      });

      const result = await response.json();
      
      if (response.ok && result.code === 0) {
        return result.data as ImageGenerationResult;
      } else {
        console.error(`Failed to poll status for ${imageId}:`, result.message);
        return null;
      }
    } catch (error) {
      console.error(`Error polling status for ${imageId}:`, error);
      return null;
    }
  }, []);

  // 开始轮询正在处理的图片
  const startPollingForProcessingImages = useCallback((imageList: ImageGenerationResult[]) => {
    // 清理现有的轮询
    pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
    pollingIntervalsRef.current.clear();
    setPollingImages(new Set());

    // 找出正在处理的图片
    const processingImages = imageList.filter(img => 
      img.status === "pending" || 
      img.status === "processing" || 
      img.status === "in_progress" || 
      img.status === "in_queue"
    );

    console.log(`🔄 Starting polling for ${processingImages.length} processing images`);

    processingImages.forEach(img => {
      startPollingImage(img.id);
    });
  }, []);

  // 开始轮询单个图片
  const startPollingImage = useCallback((imageId: string) => {
    // 避免重复轮询
    if (pollingImages.has(imageId) || pollingIntervalsRef.current.has(imageId)) {
      return;
    }

    console.log(`📡 Starting polling for image: ${imageId}`);
    setPollingImages(prev => new Set(prev).add(imageId));

    let pollCount = 0;
    const maxPollCount = 150; // 最大轮询5分钟 (150 * 2秒)

    const interval = setInterval(async () => {
      pollCount++;
      
      // 超过最大轮询次数则停止
      if (pollCount > maxPollCount) {
        console.warn(`⏰ Polling timeout for image: ${imageId}`);
        stopPollingImage(imageId);
        return;
      }

      const updatedImage = await pollImageStatus(imageId);
      
      if (updatedImage) {
        // 更新图片状态
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === imageId ? { ...img, ...updatedImage } : img
          )
        );

        // 如果图片已完成或失败，停止轮询
        if (updatedImage.status === "completed" || updatedImage.status === "failed") {
          console.log(`✅ Polling completed for image: ${imageId}, status: ${updatedImage.status}`);
          stopPollingImage(imageId);
          
          // 如果图片成功生成，显示通知
          if (updatedImage.status === "completed" && updatedImage.image_url) {
            toast.success(`图片生成完成: ${updatedImage.image_url}`, { duration: 5000 });
          } else if (updatedImage.status === "failed") {
            toast.error(`图片生成失败: ${updatedImage.error_message || "未知错误"}`);
          }
        }
      }
    }, 2000); // 每2秒轮询一次

    pollingIntervalsRef.current.set(imageId, interval);
  }, [pollImageStatus, pollingImages]);

  // 停止轮询单个图片
  const stopPollingImage = useCallback((imageId: string) => {
    const interval = pollingIntervalsRef.current.get(imageId);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(imageId);
      setPollingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
      console.log(`🛑 Stopped polling for image: ${imageId}`);
    }
  }, []);

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
      toast.success("Removed from favorites");
    } else {
      newFavorites.add(imageId);
      toast.success("Added to favorites");
    }
    saveFavorites(newFavorites);
  };

  // Download image
  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  // Copy prompt
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  // Copy image URL
  const copyImageUrl = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Image URL copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy image URL");
    }
  };

  // Open image in new tab
  const openImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
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
        toast.success("Image deleted successfully");
        
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
      toast.error(errorMessage);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "saved_to_r2":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
      case "in_progress":
        return (
          <Badge variant="default" className="bg-blue-600 text-white">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "pending":
      case "in_queue":
        return (
          <Badge variant="default" className="bg-yellow-600 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // 清理轮询
  useEffect(() => {
    return () => {
      // 清理所有轮询间隔
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    fetchHistory();
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
          
          // 如果新图片是处理中状态，开始轮询
          if (newImage.status === "pending" || 
              newImage.status === "processing" || 
              newImage.status === "in_progress" || 
              newImage.status === "in_queue") {
            setTimeout(() => {
              startPollingImage(newImage.id);
            }, 1000); // 延迟1秒开始轮询，避免立即轮询
          }
          
          return newImages;
        }
      });
    }
  }, [newImage, startPollingImage]);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Header */}
      <header className="border-b border-gray-700 px-4 md:px-6 py-4">
        <div className="flex items-center space-x-2">
          <Image className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Image History</h3>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
            <h3 className="text-lg font-medium text-white mb-2">No images yet</h3>
            <p className="text-gray-400">
              Your generated images will appear here once you start creating.
            </p>
          </div>
        </div>
      ) : (
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
          <div className="divide-y divide-gray-700">
            {images.map((image) => {
              // Debug: log image data
              console.log('Rendering image:', {
                id: image.id,
                status: image.status,
                prompt: image.prompt?.slice(0, 50) + '...',
                hasImage: !!image.image_url
              });
              
              return (
                <div key={image.id} className="p-5 space-y-4">
                {/* Header: Status + Prompt + Timestamp */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusBadge(image.status)}
                    <p className="text-base font-bold text-white leading-relaxed flex-1 line-clamp-2">
                      {image.prompt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Delete button - always show */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteImage(image.id, image.prompt)}
                      className="text-red-400 hover:text-red-600 bg-red-50/10 hover:bg-red-50/20"
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(image.id)}
                      className="text-gray-400 hover:text-red-400"
                      title="Add to favorites"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.has(image.id) ? "fill-red-400 text-red-400" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Image Preview */}
                {(image.status === "completed" || image.status === "saved_to_r2") && image.image_url && (
                  <div className="relative group">
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer"
                      onClick={() => openImage(image.image_url!)}
                    />
                    
                    {/* Download button - always visible on image */}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.image_url!, image.prompt);
                        }}
                        className="bg-black/80 text-white hover:bg-black backdrop-blur-sm border-0 h-8 w-8 p-0 shadow-lg"
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Hover overlay with additional actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImage(image.image_url!);
                          }}
                          className="bg-white/90 text-black hover:bg-white"
                          title="Open image in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyImageUrl(image.image_url!);
                          }}
                          className="bg-white/90 text-black hover:bg-white"
                          title="Copy image URL"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPrompt(image.prompt);
                          }}
                          className="bg-white/90 text-black hover:bg-white"
                          title="Copy prompt"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {(image.status === "processing" || image.status === "pending" || image.status === "in_progress" || image.status === "in_queue") && (
                  <div className="h-48 bg-gray-700 rounded-lg flex items-center justify-center relative">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {(image.status === "processing" || image.status === "in_progress") ? "Generating image..." : "Waiting in queue..."}
                      </p>
                      {pollingImages.has(image.id) && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse mx-1"></div>
                          <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse mx-1 animation-delay-200"></div>
                          <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse mx-1 animation-delay-400"></div>
                          <span className="text-xs text-blue-400 ml-2">Auto-refreshing</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {image.status === "failed" && (
                  <div className="h-48 bg-red-900/20 border border-red-700 rounded-lg flex items-center justify-center">
                    <div className="text-center p-4">
                      <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-400 mb-1">Generation failed</p>
                      {image.error_message && (
                        <p className="text-xs text-red-300">{image.error_message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>{formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}</span>
                    <span>{image.model}</span>
                    <span>{image.aspect_ratio}</span>
                    <span>{image.quality}</span>
                    {image.style && image.style !== "auto" && <span>{image.style}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{image.credits_used} credits</span>
                  </div>
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
