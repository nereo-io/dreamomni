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
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import ImageHistorySkeleton from "./ImageHistorySkeleton";

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
  filterMode?: "text-to-image" | "image-to-image" | "all"; // 过滤模式
}

export default function ImageHistory({ refreshTrigger, userId, newImage, filterMode = "all" }: ImageHistoryProps) {
  const [images, setImages] = useState<ImageGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pollingImages, setPollingImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const t = useTranslations("imageHistory");

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

  // 检查是否所有关键内容都已加载完成
  const checkAllContentLoaded = useCallback(() => {
    const hasProcessingImages = images.some(img => 
      img.status === "pending" || 
      img.status === "processing" || 
      img.status === "in_progress" || 
      img.status === "in_queue"
    );

    // 如果没有处理中的图片，并且没有正在加载的图片，则结束loading
    if (!hasProcessingImages && loadingImages.size === 0) {
      setLoading(false);
    }
  }, [images, loadingImages]);

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
  const fetchHistory = async () => {
    if (!userId) {
      console.log("📝 No userId provided, skipping fetchHistory");
      setImages([]);
      setLoading(false);
      return;
    }

    console.log("🔄 Fetching image history for userId:", userId);
    setLoading(true); // 开始加载时设置loading状态

    try {
      const response = await fetch("/api/image-generations/history", {
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
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
          message: data.message
        });

        if (data.code === 0 && Array.isArray(data.data)) {
          // Apply filter based on mode
          let filteredData = data.data;
          if (filterMode !== "all") {
            filteredData = data.data.filter((img: ImageGenerationResult) => {
              if (filterMode === "text-to-image") {
                return img.model === "google/nano-banana";
              } else if (filterMode === "image-to-image") {
                return img.model === "nano-banana-edit";
              }
              return true;
            });
          }
          
          setImages(filteredData);
          
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
          
          // 开始轮询生成中的图片
          startPollingForProcessingImages(filteredData);
          
          // 检查是否需要结束loading状态
          const hasProcessingImages = filteredData.some((img: ImageGenerationResult) => 
            img.status === "pending" || 
            img.status === "processing" || 
            img.status === "in_progress" || 
            img.status === "in_queue"
          );
          
          // 如果没有处理中的图片，立即结束loading
          if (!hasProcessingImages) {
            setLoading(false);
          }
        } else {
          console.error("❌ Invalid response format:", data);
          setImages([]);
          setLoading(false);
        }
      } else {
        console.error("❌ Failed to fetch image history:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
        setImages([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching image history:", error);
      setImages([]);
      setLoadingImages(new Set()); // 清空加载中的图片
      setLoading(false); // 出错时立即停止loading
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
            toast.success(t("generatingComplete"), { duration: 3000 });
          } else if (updatedImage.status === "failed") {
            toast.error(t("generatingFailed", { error: updatedImage.error_message || t("unknownError") }));
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
      toast.success(t("removedFromFavorites"));
    } else {
      newFavorites.add(imageId);
      toast.success(t("addedToFavorites"));
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
      // 优化顺序：代理方法优先，因为可以绕过CORS限制
      const downloadMethods = [
        () => downloadWithProxy(imageUrl, filename),    // 最可靠：使用代理绕过CORS
        () => downloadWithCanvas(imageUrl, filename),   // 次选：Canvas方法处理CORS
        () => downloadWithFetch(imageUrl, filename),    // 第三：直接fetch（可能被CORS阻止）
        () => downloadWithDirectLink(imageUrl, filename) // 最后：直接链接（CORS限制时无效）
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
      
      // 显示下载失败的错误信息
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`下载失败: ${errorMessage}`, { duration: 4000 });
    }
  };

  // 方法3: 使用 fetch 下载（可能被CORS阻止）
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
    toast.success(t("imageDownloaded"));
  };

  // 方法1: 通过代理下载（避免CORS问题）
  const downloadWithProxy = async (imageUrl: string, filename: string) => {
    console.log("🌐 Attempting proxy download:", imageUrl);
    
    // 尝试多个代理服务，提高成功率
    const proxyServices = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imageUrl)}`,
      `https://cors-anywhere.herokuapp.com/${imageUrl}`,
      // 添加更多备用代理
      `https://thingproxy.freeboard.io/fetch/${imageUrl}`,
      `https://api.proxify.io/?url=${encodeURIComponent(imageUrl)}`
    ];

    for (let i = 0; i < proxyServices.length; i++) {
      try {
        console.log(`🔄 Trying proxy service ${i + 1}:`, proxyServices[i]);
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`⏰ Proxy service ${i + 1} timeout after 10 seconds`);
          controller.abort();
        }, 10000); // 10秒超时

        const response = await fetch(proxyServices[i], {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId); // 清除超时定时器
        console.log(`📡 Proxy service ${i + 1} response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          throw new Error(`Proxy ${i + 1} failed: ${response.status}`);
        }

        const blob = await response.blob();
        console.log(`📦 Proxy ${i + 1} blob received:`, {
          size: blob.size,
          type: blob.type,
          constructor: blob.constructor.name
        });
        
        if (blob.size === 0) {
          throw new Error(`Proxy ${i + 1} returned empty image`);
        }

        console.log(`🎯 About to call forceDownload for proxy ${i + 1}`);
        
        // 使用通用强制下载函数
        try {
          forceDownload(blob, filename);
          console.log(`✅ Proxy download successful with service ${i + 1}`);
          toast.success(t("imageDownloaded"));
          return;
        } catch (downloadError) {
          console.error(`❌ forceDownload failed for proxy ${i + 1}:`, downloadError);
          console.warn(`⚠️ forceDownload failed for proxy ${i + 1}, trying alternative method:`, downloadError);
          
          // 备用下载方法：直接创建临时链接
          try {
            const tempUrl = window.URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = tempUrl;
            tempLink.download = filename;
            tempLink.style.display = 'none';
            
            document.body.appendChild(tempLink);
            
            // 用户交互触发下载（更可靠）
            setTimeout(() => {
              tempLink.click();
              console.log(`✅ Alternative download triggered for proxy ${i + 1}`);
              toast.success(t("imageDownloaded"));
              
              // 清理
              setTimeout(() => {
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(tempUrl);
              }, 1000);
            }, 100);
            
            return;
          } catch (altError) {
            console.error(`❌ Alternative download also failed for proxy ${i + 1}:`, altError);
            
            // 最终备用：直接创建下载链接并立即点击
            try {
              console.log(`🚨 Trying final fallback method for proxy ${i + 1}`);
              const finalUrl = URL.createObjectURL(blob);
              const finalLink = document.createElement('a');
              finalLink.download = filename;
              finalLink.href = finalUrl;
              
              // 直接点击，不添加到DOM
              finalLink.click();
              
              console.log(`✅ Final fallback download triggered for proxy ${i + 1}`);
              toast.success(t("imageDownloaded"));
              
              // 清理
              setTimeout(() => URL.revokeObjectURL(finalUrl), 1000);
              return;
              
            } catch (finalError) {
              console.error(`❌ Final fallback also failed for proxy ${i + 1}:`, finalError);
              throw downloadError; // 抛出原始错误
            }
          }
        }
        
      } catch (error) {
        console.warn(`⚠️ Proxy service ${i + 1} failed:`, error);
        
        // 特别处理不同类型的错误
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`⏰ Proxy service ${i + 1} was aborted due to timeout`);
          } else if (error.message.includes('Failed to fetch')) {
            console.warn(`🌐 Network error with proxy service ${i + 1}`);
          } else {
            console.warn(`❌ Other error with proxy service ${i + 1}:`, error.message);
          }
        }
        
        if (i === proxyServices.length - 1) {
          throw new Error(`All ${proxyServices.length} proxy services failed. Last error: ${error}`);
        } else {
          console.log(`🔄 Trying next proxy service (${i + 2}/${proxyServices.length})...`);
        }
      }
    }
  };

  // 方法4: 直接链接下载（CORS限制时无效）
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

  // 方法2: 使用 Canvas 下载（处理CORS问题）
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
            toast.success(t("imageDownloaded"));
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
    console.log("🔽 Starting forceDownload:", {
      blobSize: blob.size,
      blobType: blob.type,
      filename: filename
    });
    
    if (blob.size === 0) {
      console.error("❌ Blob is empty, cannot download");
      throw new Error("Empty blob provided for download");
    }
    
    const url = window.URL.createObjectURL(blob);
    console.log("📦 Created blob URL:", url);
    
    // 创建下载链接
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.cssText = "display: none; position: absolute; top: -9999px; left: -9999px;";
    downloadLink.setAttribute('rel', 'noopener noreferrer');
    downloadLink.setAttribute('target', '_self');
    
    console.log("🔗 Created download link:", {
      href: downloadLink.href,
      download: downloadLink.download,
      target: downloadLink.target
    });
    
    // 添加到DOM
    document.body.appendChild(downloadLink);
    console.log("📌 Added link to DOM");
    
    // 增强的下载触发函数
    const triggerDownload = () => {
      let downloadTriggered = false;
      
      try {
        console.log("🖱️ Attempting standard click...");
        downloadLink.click();
        downloadTriggered = true;
        console.log("✅ Standard click successful");
      } catch (clickError) {
        console.warn("⚠️ Standard click failed:", clickError);
        
        try {
          console.log("🖱️ Attempting MouseEvent...");
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
          });
          downloadLink.dispatchEvent(clickEvent);
          downloadTriggered = true;
          console.log("✅ MouseEvent successful");
        } catch (eventError) {
          console.warn("⚠️ MouseEvent failed:", eventError);
          
          try {
            console.log("🖱️ Attempting legacy event...");
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            downloadLink.dispatchEvent(event);
            downloadTriggered = true;
            console.log("✅ Legacy event successful");
          } catch (ieError) {
            console.error("❌ All click methods failed:", ieError);
            throw new Error("Cannot trigger download - all click methods failed");
          }
        }
      }
      
      if (!downloadTriggered) {
        throw new Error("Download was not triggered");
      }
      
      return downloadTriggered;
    };
    
    // 尝试触发下载
    try {
      const success = triggerDownload();
      console.log("🎯 Download trigger result:", success);
      
      // 验证下载是否真正开始（检查浏览器下载状态）
      setTimeout(() => {
        console.log("🔍 Checking download status after 1 second...");
        console.log("💡 如果没有看到下载，请检查浏览器是否阻止了自动下载");
        console.log("💡 Look for download blocked icon in browser address bar");
      }, 1000);
      
    } catch (triggerError) {
      console.error("❌ Failed to trigger download:", triggerError);
      throw triggerError;
    }
    
    // 延迟清理资源，确保下载有时间开始
    setTimeout(() => {
      try {
        console.log("🧹 Cleaning up resources...");
        window.URL.revokeObjectURL(url);
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
          console.log("✅ Resources cleaned up");
        }
      } catch (cleanupError) {
        console.warn("⚠️ Resource cleanup warning:", cleanupError);
      }
    }, 5000); // 增加清理延迟到5秒
    
    console.log("✅ Force download process completed for:", filename);
  };

  // 测试下载功能的简化版本
  const testSimpleDownload = (imageUrl: string, filename: string) => {
    console.log("🧪 Testing simple download method...");
    
    // 创建一个简单的测试用 blob
    const testText = "This is a test file";
    const testBlob = new Blob([testText], { type: 'text/plain' });
    
    console.log("🧪 Test blob created:", {
      size: testBlob.size,
      type: testBlob.type
    });
    
    const url = URL.createObjectURL(testBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-download.txt';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log("🧪 Simple download test completed");
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
                    onCopyPrompt={copyPrompt}
                    getStatusBadge={getStatusBadge}
                    formatModelDisplayName={formatModelDisplayName}
                    onImageStartLoading={handleImageStartLoading}
                    onImageLoaded={handleImageLoaded}
                    t={t}
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
  onCopyPrompt: (prompt: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  formatModelDisplayName: (modelName: string) => string;
  onImageStartLoading?: (imageId: string) => void;
  onImageLoaded?: (imageId: string) => void;
  t: (key: string, params?: any) => string;
}

const MasonryImageCard = ({ 
  image, 
  pollingImages, 
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
  t
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
                  title={t("downloadImage")}
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
                  title={t("openInNewTab")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyPrompt(image.prompt);
                  }}
                  className="bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm"
                  title={t("copyPrompt")}
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
                {(image.status === "processing" || image.status === "in_progress") ? t("generatingImage") : t("inQueue")}
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
                title={t("deleteImage")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {/* Favorite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(image.id)}
                className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"
                title={t("addToFavorites")}
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
              <span>{formatModelDisplayName(image.model)}</span>
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

