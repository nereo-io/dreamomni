/**
 * Image Storage Service
 * 处理图片上传到 R2 存储的服务
 */

import { IMAGE_CACHE_CONTROL } from "@/lib/cache-control";
import { newStorage } from "@/lib/storage";
import type { ProviderImageResult } from "@/types/provider";

export interface ImageUploadResult {
  success: boolean;
  r2Urls?: string[];
  failedCount: number;
  error?: string;
}

export class ImageStorageService {
  /**
   * 批量上传图片到 R2
   * @param images - Provider 返回的图片数组
   * @param generationId - 图片生成记录 ID
   * @returns 上传结果，包含 R2 URLs
   */
  static async uploadImagesToR2(
    images: ProviderImageResult[],
    generationId: string
  ): Promise<ImageUploadResult> {
    try {
      const storage = newStorage();
      const r2Urls: string[] = [];
      let failedCount = 0;

      console.log(`[ImageStorage] Starting R2 upload for ${images.length} images`);

      // 并行上传所有图片
      const uploadPromises = images.map(async (image, index) => {
        const fileName = `images/${generationId}-${Date.now()}-${index}.${image.format || 'png'}`;
        
        try {
          const uploadResult = await storage.downloadAndUpload({
            url: image.url,
            key: fileName,
            contentType: `image/${image.format || 'png'}`,
            cacheControl: IMAGE_CACHE_CONTROL,
          });
          
          if (uploadResult?.url) {
            console.log(`[ImageStorage] Image ${index + 1}/${images.length} uploaded to R2: ${uploadResult.url}`);
            return uploadResult.url;
          } else {
            console.warn(`[ImageStorage] No URL returned for image ${index + 1}`);
            failedCount++;
            return null;
          }
        } catch (uploadError) {
          console.error(`[ImageStorage] Failed to upload image ${index + 1}:`, uploadError);
          failedCount++;
          return null;
        }
      });

      // 等待所有上传完成
      const results = await Promise.all(uploadPromises);
      
      // 过滤出成功的 URLs
      for (const url of results) {
        if (url) {
          r2Urls.push(url);
        }
      }

      console.log(`[ImageStorage] Upload complete: ${r2Urls.length} successful, ${failedCount} failed`);

      return {
        success: r2Urls.length > 0,
        r2Urls: r2Urls.length > 0 ? r2Urls : undefined,
        failedCount,
      };
    } catch (error) {
      console.error("[ImageStorage] Service error:", error);
      return {
        success: false,
        failedCount: images.length,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 上传单张图片到 R2
   * @param imageUrl - 原始图片 URL
   * @param generationId - 图片生成记录 ID
   * @param format - 图片格式
   * @returns R2 URL 或 null
   */
  static async uploadSingleImageToR2(
    imageUrl: string,
    generationId: string,
    format: string = 'png'
  ): Promise<string | null> {
    try {
      const storage = newStorage();
      const fileName = `images/${generationId}-${Date.now()}.${format}`;
      
      console.log(`[ImageStorage] Uploading single image to R2: ${fileName}`);
      
      const uploadResult = await storage.downloadAndUpload({
        url: imageUrl,
        key: fileName,
        contentType: `image/${format}`,
        cacheControl: IMAGE_CACHE_CONTROL,
      });
      
      if (uploadResult?.url) {
        console.log(`[ImageStorage] Single image uploaded to R2: ${uploadResult.url}`);
        return uploadResult.url;
      }
      
      return null;
    } catch (error) {
      console.error("[ImageStorage] Failed to upload single image:", error);
      return null;
    }
  }
}
