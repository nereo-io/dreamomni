/**
 * 图片生成轮询服务
 * 统一管理图片生成状态的轮询逻辑
 */

import { 
  ImageGenerationHistoryItem,
  ImagePollingConfig,
  ImagePollingOptions,
  ImagePollingUpdate,
  BatchUpdateResult
} from '@/types/image';

// 默认配置
const DEFAULT_CONFIG: ImagePollingConfig = {
  interval: 3000,           // 3秒轮询间隔
  maxDuration: 5 * 60 * 1000, // 5分钟最大轮询时间
  incompleteStatuses: [
    'pending',
    'prompt_optimizing',
    'in_queue', 
    'in_progress'
  ]
};

/**
 * 图片轮询服务类
 */
class ImagePollingService {
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map();
  private imageStartTimes: Map<string, number> = new Map();
  
  /**
   * 获取单个图片状态
   */
  async fetchImageStatus(imageId: string): Promise<any> {
    try {
      const response = await fetch('/api/image-generation/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.code === 0 ? result.data : null;
    } catch (error) {
      console.error(`Error fetching status for image ${imageId}:`, error);
      throw error;
    }
  }
  
  /**
   * 批量获取图片状态
   */
  async fetchBatchImageStatus(imageIds: string[]): Promise<BatchUpdateResult> {
    const results: BatchUpdateResult = { 
      success: [], 
      failed: [], 
      timeout: [],
      updates: []
    };
    
    const promises = imageIds.map(async (id) => {
      try {
        const data = await this.fetchImageStatus(id);
        if (data) {
          results.success.push(id);
          return { id, data };
        } else {
          results.failed.push(id);
          return null;
        }
      } catch (error) {
        console.error(`Failed to fetch status for image ${id}:`, error);
        results.failed.push(id);
        return null;
      }
    });
    
    const updates = await Promise.all(promises);
    results.updates = updates.filter((u): u is ImagePollingUpdate => u !== null);
    
    return results;
  }
  
  /**
   * 检查图片是否超时
   */
  isImageTimeout(imageId: string, createdAt: string, maxDuration?: number): boolean {
    const max = maxDuration || DEFAULT_CONFIG.maxDuration;
    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsed = now - createdTime;
    
    // 如果有记录的开始时间，使用记录的时间
    const startTime = this.imageStartTimes.get(imageId);
    if (startTime) {
      return (now - startTime) >= max;
    }
    
    // 否则使用创建时间
    return elapsed >= max;
  }
  
  /**
   * 获取需要轮询的图片
   */
  getIncompleteImages(
    images: ImageGenerationHistoryItem[], 
    config?: Partial<ImagePollingConfig>
  ): ImageGenerationHistoryItem[] {
    const statuses = config?.incompleteStatuses || DEFAULT_CONFIG.incompleteStatuses;
    const maxDuration = config?.maxDuration || DEFAULT_CONFIG.maxDuration;
    const now = Date.now();
    
    return images.filter(image => {
      // 检查状态是否需要轮询
      const statusLower = image.status.toLowerCase();
      if (!statuses.includes(statusLower)) {
        return false;
      }
      
      // 检查创建时间是否已经超过最大时长
      const createdTime = new Date(image.created_at).getTime();
      const elapsedSinceCreation = now - createdTime;
      
      if (elapsedSinceCreation >= maxDuration) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 开始轮询多个图片
   */
  startPolling(
    images: ImageGenerationHistoryItem[],
    options?: ImagePollingOptions,
    config?: Partial<ImagePollingConfig>
  ): string {
    const pollingId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const interval = config?.interval || DEFAULT_CONFIG.interval;
    const maxDuration = config?.maxDuration || DEFAULT_CONFIG.maxDuration;
    
    // 记录所有图片的开始时间
    images.forEach(img => {
      if (!this.imageStartTimes.has(img.id)) {
        this.imageStartTimes.set(img.id, Date.now());
      }
    });
    
    const timer = setInterval(async () => {
      const imagesToPoll = this.getIncompleteImages(images, config);
      
      // 如果没有需要轮询的图片了，停止轮询
      if (imagesToPoll.length === 0) {
        this.stopPolling(pollingId);
        return;
      }
      
      // 检查超时
      const now = Date.now();
      const timeoutImages: ImageGenerationHistoryItem[] = [];
      const activeImages: ImageGenerationHistoryItem[] = [];
      
      imagesToPoll.forEach(img => {
        const startTime = this.imageStartTimes.get(img.id) || 
                         new Date(img.created_at).getTime();
        const elapsed = now - startTime;
        
        if (elapsed >= maxDuration) {
          timeoutImages.push(img);
        } else {
          activeImages.push(img);
        }
      });
      
      // 处理超时的图片
      timeoutImages.forEach(img => {
        options?.onTimeout?.(img);
        this.imageStartTimes.delete(img.id);
      });
      
      // 批量更新活跃图片
      if (activeImages.length > 0) {
        try {
          const result = await this.fetchBatchImageStatus(
            activeImages.map(img => img.id)
          );
          
          // 通知更新
          if (result.updates && result.updates.length > 0 && options?.onUpdate) {
            options.onUpdate(result.updates);
          }
          
          // 检查完成的图片
          result.updates?.forEach(update => {
            const status = update.data.status?.toLowerCase();
            if (status === 'completed' || status === 'saved_to_r2' || status === 'failed') {
              // 触发完成回调
              const completeImage = activeImages.find(img => img.id === update.id);
              if (completeImage) {
                const updatedImage = { ...completeImage, ...update.data };
                options?.onComplete?.(updatedImage);
              }
              
              // 清理开始时间记录
              this.imageStartTimes.delete(update.id);
            }
          });
        } catch (error) {
          console.error('Error updating image status:', error);
          activeImages.forEach(img => {
            options?.onError?.(error as Error, img.id);
          });
        }
      }
    }, interval);
    
    this.pollingTimers.set(pollingId, timer);
    return pollingId;
  }
  
  /**
   * 停止指定轮询
   */
  stopPolling(pollingId: string): void {
    const timer = this.pollingTimers.get(pollingId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(pollingId);
    }
  }
  
  /**
   * 停止所有轮询
   */
  stopAllPolling(): void {
    this.pollingTimers.forEach((timer, id) => {
      clearInterval(timer);
    });
    this.pollingTimers.clear();
    this.imageStartTimes.clear();
  }
  
  /**
   * 获取当前活跃的轮询数量
   */
  getActivePollingCount(): number {
    return this.pollingTimers.size;
  }
  
  /**
   * 清理超时的开始时间记录
   */
  cleanupTimeoutRecords(maxAge: number = 10 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.imageStartTimes.forEach((startTime, imageId) => {
      if (now - startTime > maxAge) {
        toDelete.push(imageId);
      }
    });
    
    toDelete.forEach(id => {
      this.imageStartTimes.delete(id);
    });
  }
}

// 导出单例
export const imagePollingService = new ImagePollingService();