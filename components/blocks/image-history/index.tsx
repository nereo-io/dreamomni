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
            toast.success("图片生成完成！", { duration: 3000 });
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

  // Download image to local file system
  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      console.log("🔽 Starting image download:", imageUrl);
      
      // 验证URL
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error("Invalid image URL provided");
      }

      // 获取图片文件扩展名
      const urlParts = imageUrl.split('.');
      const extension = urlParts[urlParts.length - 1]?.split('?')[0]?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExtension = validExtensions.includes(extension) ? extension : 'jpg';

      // 生成安全的文件名
      const safePrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const filename = `image-${safePrompt}-${timestamp}.${fileExtension}`;
      
      console.log("📝 Image URL:", imageUrl);
      console.log("📁 File extension:", fileExtension);
      console.log("📄 Generated filename:", filename);

      // 尝试多种下载方法，确保能下载到本地
      const downloadMethods = [
        () => downloadWithFetch(imageUrl, filename),
        () => downloadWithProxy(imageUrl, filename),
        () => downloadWithDirectLink(imageUrl, filename),
        () => downloadWithCanvas(imageUrl, filename)
      ];

      for (let i = 0; i < downloadMethods.length; i++) {
        try {
          await downloadMethods[i]();
          console.log(`✅ Download successful with method ${i + 1}`);
          return;
        } catch (error) {
          console.warn(`⚠️ Download method ${i + 1} failed:`, error);
          if (i === downloadMethods.length - 1) {
            // 所有方法都失败了，提供手动下载选项
            throw error;
          }
        }
      }
      
    } catch (error) {
      console.error("❌ All download methods failed:", error);
      
      // 最后的备用方案：提供手动下载提示
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`自动下载失败，正在打开图片供手动保存`, { duration: 4000 });
      
      // 延迟一点再打开，让用户看到错误提示
      setTimeout(() => {
        window.open(imageUrl, '_blank', 'noopener,noreferrer');
      }, 1000);
    }
  };

  // 方法1: 使用 fetch 下载（最可靠的方法）
  const downloadWithFetch = async (imageUrl: string, filename: string) => {
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      mode: 'cors',
    });

    console.log("📡 Fetch response status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log("📦 Blob size:", blob.size, "bytes");

    if (blob.size === 0) {
      throw new Error("Downloaded image is empty");
    }

    // 使用通用强制下载函数
    forceDownload(blob, filename);

    console.log("✅ Fetch download successful");
    toast.success(`图片已下载: ${filename}`);
  };

  // 方法2: 通过代理下载（避免CORS问题）
  const downloadWithProxy = async (imageUrl: string, filename: string) => {
    // 使用 CORS 代理服务
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Proxy fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Proxy returned empty image");
    }

    // 使用通用强制下载函数
    forceDownload(blob, filename);

    console.log("✅ Proxy download successful");
    toast.success(`图片已下载: ${filename}`);
  };

  // 方法3: 直接链接下载
  const downloadWithDirectLink = async (imageUrl: string, filename: string) => {
    return new Promise<void>((resolve, reject) => {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = filename;
      a.style.cssText = "display: none; position: absolute; top: -9999px;";
      a.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(a);
      
      // 尝试多种点击方式确保下载触发
      try {
        // 方法1: 程序化点击
        a.click();
      } catch (e) {
        // 方法2: 事件分发
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });
        a.dispatchEvent(clickEvent);
      }
      
      // 再次尝试确保下载
      setTimeout(() => {
        try {
          const secondClickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          a.dispatchEvent(secondClickEvent);
        } catch (e) {
          console.warn("Second click attempt failed:", e);
        }
      }, 100);
      
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        console.log("✅ Direct link download triggered");
        toast.success(`图片下载已开始: ${filename}`);
        resolve();
      }, 1000);
    });
  };

  // 方法4: 使用 Canvas 下载（最后备用）
  const downloadWithCanvas = async (imageUrl: string, filename: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // 转换为 blob 并下载
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to blob conversion failed'));
              return;
            }
            
            // 使用通用强制下载函数
            forceDownload(blob, filename);
            
            console.log("✅ Canvas download successful");
            toast.success(`图片已下载: ${filename}`);
            resolve();
          }, 'image/jpeg', 0.9);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for canvas download'));
      };
      
      img.src = imageUrl;
      
      // 超时处理
      setTimeout(() => {
        reject(new Error('Canvas download timeout'));
      }, 10000);
    });
  };

  // 强制触发浏览器下载的通用函数
  const forceDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    
    // 创建隐藏的下载链接
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.cssText = "display: none; position: absolute; top: -9999px; left: -9999px;";
    downloadLink.setAttribute('rel', 'noopener noreferrer');
    
    // 添加到DOM
    document.body.appendChild(downloadLink);
    
    // 使用多种方式触发下载，确保跨浏览器兼容性
    const triggerDownload = () => {
      try {
        // 方法1: 标准点击
        downloadLink.click();
      } catch (clickError) {
        try {
          // 方法2: 手动创建点击事件
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
          });
          downloadLink.dispatchEvent(clickEvent);
        } catch (eventError) {
          // 方法3: 使用旧式事件创建（IE兼容）
          try {
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            downloadLink.dispatchEvent(event);
          } catch (ieError) {
            console.error("All download trigger methods failed", ieError);
            throw new Error("Cannot trigger download");
          }
        }
      }
    };
    
    // 立即触发下载
    triggerDownload();
    
    // 延迟再次触发，确保下载开始
    setTimeout(() => {
      try {
        triggerDownload();
      } catch (e) {
        console.warn("Second download trigger failed:", e);
      }
    }, 200);
    
    // 清理资源
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
      } catch (cleanupError) {
        console.warn("Resource cleanup warning:", cleanupError);
      }
    }, 3000);
    
    console.log("✅ Force download triggered for:", filename);
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
          {/* Responsive Masonry Grid */}
          <div className="p-4">
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {images.map((image) => {
                console.log('Rendering image:', {
                  id: image.id,
                  status: image.status,
                  prompt: image.prompt?.slice(0, 50) + '...',
                  hasImage: !!image.image_url
                });
                
                return (
                  <MasonryImageCard 
                    key={image.id}
                    image={image}
                    pollingImages={pollingImages}
                    favorites={favorites}
                    onDelete={deleteImage}
                    onToggleFavorite={toggleFavorite}
                    onDownload={downloadImage}
                    onOpen={openImage}
                    onCopyUrl={copyImageUrl}
                    onCopyPrompt={copyPrompt}
                    getStatusBadge={getStatusBadge}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Masonry Image Card Component
interface MasonryImageCardProps {
  image: ImageGenerationResult;
  pollingImages: Set<string>;
  favorites: Set<string>;
  onDelete: (id: string, prompt: string) => void;
  onToggleFavorite: (id: string) => void;
  onDownload: (imageUrl: string, prompt: string) => void;
  onOpen: (imageUrl: string) => void;
  onCopyUrl: (imageUrl: string) => void;
  onCopyPrompt: (prompt: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const MasonryImageCard = ({ 
  image, 
  pollingImages, 
  favorites, 
  onDelete, 
  onToggleFavorite, 
  onDownload, 
  onOpen, 
  onCopyUrl, 
  onCopyPrompt,
  getStatusBadge 
}: MasonryImageCardProps) => {
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
  };

  return (
    <div className="break-inside-avoid mb-4">
      <div className="bg-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
        
        {/* Image Preview */}
        {(image.status === "completed" || image.status === "saved_to_r2") && image.image_url && (
          <div className="relative group">
            <img
              src={image.image_url}
              alt={image.prompt}
              className={`w-full object-cover cursor-pointer transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                aspectRatio: naturalDimensions ? `${naturalDimensions.width}/${naturalDimensions.height}` : '1/1'
              }}
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
            
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(image.image_url!, image.prompt);
                  }}
                  className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(image.image_url!);
                  }}
                  className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm"
                  title="Open image in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUrl(image.image_url!);
                  }}
                  className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm"
                  title="Copy image URL"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyPrompt(image.prompt);
                  }}
                  className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm"
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
          <div className="aspect-square bg-gray-600 flex items-center justify-center relative">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                {(image.status === "processing" || image.status === "in_progress") ? "Generating..." : "In queue..."}
              </p>
              {pollingImages.has(image.id) && (
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
        )}

        {/* Failed State */}
        {image.status === "failed" && (
          <div className="aspect-square bg-red-900/20 border border-red-700/50 flex items-center justify-center">
            <div className="text-center p-4">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400 mb-1">Generation failed</p>
              {image.error_message && (
                <p className="text-xs text-red-300 line-clamp-2">{image.error_message}</p>
              )}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Status Badge and Actions */}
          <div className="flex justify-between items-start gap-2">
            {getStatusBadge(image.status)}
            <div className="flex items-center gap-1">
              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(image.id, image.prompt)}
                className="text-red-400 hover:text-red-600 bg-red-50/10 hover:bg-red-50/20 h-7 w-7 p-0"
                title="Delete image"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {/* Favorite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(image.id)}
                className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"
                title="Add to favorites"
              >
                <Heart
                  className={`h-3 w-3 ${
                    favorites.has(image.id) ? "fill-red-400 text-red-400" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Prompt */}
          <p className="text-sm font-medium text-white leading-relaxed line-clamp-3">
            {image.prompt}
          </p>

          {/* Metadata */}
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>{formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}</span>
              <span>{image.credits_used} credits</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span>{image.model}</span>
              {image.aspect_ratio && <span>•</span>}
              {image.aspect_ratio && <span>{image.aspect_ratio}</span>}
              {image.quality && <span>•</span>}
              {image.quality && <span>{image.quality}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
