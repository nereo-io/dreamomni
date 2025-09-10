import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Edit, RotateCcw, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ImageGenerationResult } from "@/components/blocks/image-history";
import { useImageGenerationProgress } from "@/hooks/useImageGenerationProgress";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageProgressBar from "./ImageProgressBar";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface ImageStatusDisplayProps {
  status: string;
  statusInfo: {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }> | null;
  };
  imageUrl?: string;
  errorMessage?: string;
  createdAt?: string;
  image: ImageGenerationResult;
  onEdit?: (image: ImageGenerationResult) => void;
  onRegenerate?: (image: ImageGenerationResult) => void;
  onDelete?: (imageId: string, prompt: string) => void;
  onImageClick?: (imageUrl: string, prompt: string) => void;
  canEdit?: boolean;
  pollingImages: Set<string>;
}

const ImageStatusDisplay: React.FC<ImageStatusDisplayProps> = React.memo(({
  status,
  statusInfo,
  imageUrl,
  errorMessage,
  createdAt,
  image,
  onEdit,
  onRegenerate,
  onDelete,
  onImageClick,
  canEdit,
  pollingImages,
}) => {
  const isCompleted = status === "completed" || status === "saved_to_r2";
  const isPromptOptimizing = status === "prompt_optimizing";
  const isProcessing = ["pending", "in_queue", "in_progress", "prompt_optimizing"].includes(status);
  const isFailed = status === "failed";
  const isPolling = pollingImages.has(image.id);
  const isMobile = useIsMobile();
  
  // Use progress hook for processing states
  const progressData = useImageGenerationProgress({
    createdAt: image.created_at,
    estimatedTime: 30, // 30 seconds estimated for image generation
    status: status
  });
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const t = useTranslations("imageHistory");

  const handleDeleteClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!onDelete || isDeleting) return;
    
    // Show custom delete confirmation dialog
    setShowDeleteDialog(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    setShowDeleteDialog(false);
    
    try {
      await onDelete(image.id, image.prompt || '');
      toast.success(t("imageDeleted"));
    } catch (error) {
      console.error("Delete operation failed:", error);
      toast.error(t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Download image to local file system - 与图片历史记录保持一致
  const handleDownload = async () => {
    // 优先使用 R2 URL，如果没有则使用普通 URL
    const downloadUrl = image.image_url_r2 || image.image_url || imageUrl;
    
    if (!downloadUrl) {
      toast.error("Image not available for download");
      return;
    }

    try {
      console.log("🔽 Starting image download:", downloadUrl);
      console.log("📍 Using R2 URL:", !!image.image_url_r2);
      
      // 验证URL
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error("Invalid image URL provided");
      }

      // 获取图片文件扩展名
      const urlParts = downloadUrl.split('.');
      const extension = urlParts[urlParts.length - 1]?.split('?')[0]?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!validExtensions.includes(extension)) {
        console.warn("⚠️ Unknown extension, using jpg as fallback");
      }

      // 生成文件名
      const safePrompt = image.prompt.substring(0, 20).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${safePrompt}_${image.id}.${extension}`;
      console.log("📄 Generated filename:", filename);

      // 尝试多种下载方法，确保能下载到本地
      // 优化顺序：代理方法优先，因为可以绕过CORS限制
      const downloadMethods = [
        () => downloadWithProxy(downloadUrl, filename),    // 最可靠：使用代理绕过CORS
        () => downloadWithCanvas(downloadUrl, filename),   // 次选：Canvas方法处理CORS
        () => downloadWithFetch(downloadUrl, filename),    // 第三：直接fetch（可能被CORS阻止）
        () => downloadWithDirectLink(downloadUrl, filename) // 最后：直接链接（CORS限制时无效）
      ];

      for (let i = 0; i < downloadMethods.length; i++) {
        try {
          await downloadMethods[i]();
          console.log(`✅ Download successful with method ${i + 1}`);
          return;
        } catch (error) {
          console.warn(`⚠️ Download method ${i + 1} failed:`, error);
          if (i === downloadMethods.length - 1) {
            throw error; // 如果所有方法都失败，抛出最后一个错误
          }
        }
      }
    } catch (error) {
      console.error("💥 All download methods failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`下载失败: ${errorMessage}`, { duration: 4000 });
    }
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

    let lastError: Error | null = null;
    
    for (let i = 0; i < proxyServices.length; i++) {
      try {
        console.log(`🔄 Trying proxy service ${i + 1}:`, proxyServices[i]);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(proxyServices[i], {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        });
        
        clearTimeout(timeoutId);
        console.log(`📡 Proxy ${i + 1} response status:`, response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("📦 Blob created, size:", blob.size);

        if (blob.size === 0) {
          throw new Error("Empty response from proxy");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.cssText = "display: none; position: absolute; top: -9999px;";
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
        console.log(`✅ Proxy download ${i + 1} successful`);
        toast.success("Image downloaded");
        return;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Proxy service ${i + 1} failed:`, lastError.message);
        
        if (i === proxyServices.length - 1) {
          throw new Error(`All proxy services failed. Last error: ${lastError.message}`);
        }
      }
    }
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
            reject(new Error("Canvas context not available"));
            return;
          }

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.style.cssText = "display: none; position: absolute; top: -9999px;";
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            
            console.log("✅ Canvas download successful");
            toast.success("Image downloaded");
            resolve();
          }, 'image/jpeg', 0.95);
          
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Image failed to load for canvas"));
      };

      img.src = imageUrl;
    });
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.cssText = "display: none; position: absolute; top: -9999px;";
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    
    console.log("✅ Fetch download successful");
    toast.success("Image downloaded");
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
        a.click();
      } catch (e) {
        // 如果click失败，尝试其他方式
        const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, false);
        a.dispatchEvent(event);
      }
      
      document.body.removeChild(a);
      
      // 给下载一些时间开始
      setTimeout(() => {
        console.log("✅ Direct link download attempted");
        toast.success("Image download started");
        resolve();
      }, 1000);
    });
  };

  const handleOpen = () => {
    if (!imageUrl) {
      toast.error("Image not available");
      return;
    }
    if (onImageClick) {
      onImageClick(imageUrl, image.prompt);
    } else {
      window.open(imageUrl, "_blank");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(image);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(image);
    }
  };

  // Prompt Optimizing state - 与视频生成保持一致的样式
  if (isPromptOptimizing) {
    return (
      <div className="space-y-3">
        {/* Prompt Optimizing placeholder with Sparkles effect - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className={`${isMobile ? 'w-2/3' : 'w-1/2'} aspect-square bg-gray-700 rounded-lg flex items-center justify-center`}>
            <div className="text-center py-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                <Sparkles className="h-12 w-12 text-purple-400 relative animate-pulse mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {t("optimizingPromptTitle")}
              </h3>
              <p className="text-sm text-gray-400">
                {t("optimizingPromptDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* No action buttons during prompt optimizing */}
      </div>
    );
  }

  // Completed state
  if (isCompleted && imageUrl) {
    return (
      <>
      <div className="space-y-3">
        {/* Image preview with hover buttons - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div 
            className={`${isMobile ? 'w-2/3' : 'w-1/2'} aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer relative group`}
            onClick={handleOpen}
          >
            <img
              src={imageUrl}
              alt={image.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Hover overlay buttons - 移动端默认显示 */}
            <div className={`absolute top-3 right-3 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex gap-2`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-black/60 hover:bg-black/80 text-white border-none h-8 w-8 p-0 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black/60 hover:bg-red-600/80 text-white border-none h-8 w-8 p-0 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(e);
                  }}
                  disabled={isDeleting}
                  title="Delete image"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {(canEdit && (onEdit || onRegenerate)) && (
          <div className="flex gap-2">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-gray-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canEdit && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                className="text-gray-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        prompt={image.prompt || ''}
        isDeleting={isDeleting}
      />
      </>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <>
      <div className="space-y-3">
        {/* Processing placeholder with progress - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className={`${isMobile ? 'w-2/3' : 'w-1/2'} aspect-square bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden`}>
            {/* Background with subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
            
            {/* Content */}
            <div className="relative z-10 text-center w-full px-4">
              {/* Status text - only for prompt optimizing */}
              {status === "prompt_optimizing" && (
                <p className="text-sm font-medium text-white mb-4">
                  Optimizing Prompt...
                </p>
              )}
              
              {/* Progress bar */}
              <div className="w-full mb-4">
                <ImageProgressBar 
                  progress={progressData.progress} 
                  showPercentage={false}
                />
              </div>
              
              {/* Progress percentage and remaining time */}
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-1">
                  {Math.round(progressData.progress)}%
                </div>
                <div className="text-xs text-gray-300">
                  {progressData.remainingTime > 0 ? (
                    `${Math.floor(progressData.remainingTime)}s remaining`
                  ) : (
                    "Almost done..."
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No action buttons during processing */}
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        prompt={image.prompt || ''}
        isDeleting={isDeleting}
      />
      </>
    );
  }

  // Failed state
  if (isFailed) {
    return (
      <>
      <div className="space-y-3">
        {/* Error placeholder - 三分之二宽度，左对齐 */}
        <div className="flex justify-start">
          <div className={`${isMobile ? 'w-2/3' : 'w-1/2'} aspect-square bg-gray-700 rounded-lg flex items-center justify-center`}>
            <div className="text-center">
              <div className="text-red-400 mb-2">❌</div>
              <p className="text-sm text-red-400">Generation Failed</p>
              {errorMessage && (
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Retry and Delete buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {canEdit && onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                console.log("🗑️ FAILED STATE BUTTON CLICKED - Direct onClick handler");
                handleDeleteClick(e);
              }}
              onMouseDown={(e) => {
                console.log("🗑️ MOUSE DOWN on failed state button");
              }}
              onMouseUp={(e) => {
                console.log("🗑️ MOUSE UP on failed state button");
              }}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-400 cursor-pointer border-2 border-red-500"
              style={{ 
                pointerEvents: 'auto',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                minWidth: '40px',
                minHeight: '40px',
                zIndex: 1000,
                position: 'relative'
              }}
              title="Delete Failed Image - Click Me!"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        prompt={image.prompt || ''}
        isDeleting={isDeleting}
      />
      </>
    );
  }

  // Default state
  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-start">
          <div className={`${isMobile ? 'w-2/3' : 'w-1/2'} aspect-square bg-gray-700 rounded-lg flex items-center justify-center`}>
            <div className="text-center">
              <p className="text-sm text-gray-400">Unknown Status</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        prompt={image.prompt || ''}
        isDeleting={isDeleting}
      />
    </>
  );
});

ImageStatusDisplay.displayName = "ImageStatusDisplay";

export default ImageStatusDisplay;
