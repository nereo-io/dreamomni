/**
 * 阿里云 OSS 存储服务
 * 用于处理视频生成时的图片上传，特别是为阿里 Wan 模型优化
 */

import OSS from 'ali-oss';

export class AliOSSService {
  private client: OSS | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // 检查必要的环境变量
    const region = process.env.ALI_OSS_REGION;
    const accessKeyId = process.env.ALI_OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALI_OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.ALI_OSS_BUCKET;

    if (!region || !accessKeyId || !accessKeySecret || !bucket) {
      console.warn('阿里云 OSS 配置缺失，OSS 服务将不可用');
      console.warn('请确保配置了以下环境变量：ALI_OSS_REGION, ALI_OSS_ACCESS_KEY_ID, ALI_OSS_ACCESS_KEY_SECRET, ALI_OSS_BUCKET');
      return;
    }

    try {
      this.client = new OSS({
        region,
        accessKeyId,
        accessKeySecret,
        bucket,
        secure: true, // 使用 HTTPS
        internal: false, // 使用外网访问（内网访问需要在阿里云 VPC 内）
      });
      this.initialized = true;
    } catch (error) {
      console.error('❌ 阿里云 OSS 初始化失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 检查 OSS 服务是否可用
   */
  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * 从 URL 下载图片并上传到 OSS
   * @param sourceUrl 源图片 URL 或 data URL
   * @param key 存储在 OSS 中的路径（例如：video-inputs/2024/12/image.jpg）
   * @returns OSS 公开访问 URL
   */
  async uploadFromUrl(sourceUrl: string, key?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('阿里云 OSS 服务未初始化');
    }

    try {
      // 如果没有指定 key，自动生成
      if (!key) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = this.getFileExtension(sourceUrl) || 'jpg';
        key = `video-inputs/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${timestamp}-${randomStr}.${extension}`;
      }

      
      let buffer: Buffer;
      let contentType: string;
      
      // 检查是否为 data URL
      if (sourceUrl.startsWith('data:')) {
        // 处理 data URL
        const matches = sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format');
        }
        contentType = matches[1];
        const base64Data = matches[2];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        // 处理普通 URL
        const response = await fetch(sourceUrl);
        if (!response.ok) {
          throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = response.headers.get('content-type') || 'image/jpeg';
      }
      
      // 上传到 OSS
      const result = await this.client!.put(key, buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1年缓存
        },
      });
      
      // 生成公开访问 URL
      const publicUrl = this.getPublicUrl(result.name);
      
      return publicUrl;
      
    } catch (error) {
      console.error('❌ OSS 上传失败:', error);
      throw error;
    }
  }

  /**
   * 直接上传 Buffer 到 OSS
   * @param buffer 文件 Buffer
   * @param key 存储在 OSS 中的路径
   * @param contentType 文件类型
   * @returns OSS 公开访问 URL
   */
  async uploadBuffer(buffer: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('阿里云 OSS 服务未初始化');
    }

    try {
      
      // 上传到 OSS
      const result = await this.client!.put(key, buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1年缓存
        },
      });
      
      // 生成公开访问 URL
      const publicUrl = this.getPublicUrl(result.name);
      
      return publicUrl;
      
    } catch (error) {
      console.error('❌ OSS Buffer 上传失败:', error);
      throw error;
    }
  }

  /**
   * 生成 OSS 公开访问 URL
   * @param objectName 对象名称
   * @returns 公开访问 URL 或签名 URL
   */
  private getPublicUrl(objectName: string): string {
    const bucket = process.env.ALI_OSS_BUCKET;
    const region = process.env.ALI_OSS_REGION;
    
    // 生成签名 URL，有效期 1 小时（3600秒）
    // 这样阿里云 AI 服务可以访问私有存储桶中的文件
    try {
      if (this.client) {
        const signedUrl = this.client.signatureUrl(objectName, {
          expires: 3600,  // 1小时有效期
          method: 'GET',
          'process': undefined
        });
        return signedUrl;
      }
    } catch (error) {
      console.error('生成签名 URL 失败，使用公开 URL:', error);
    }
    
    // 降级到公开 URL
    return `https://${bucket}.${region}.aliyuncs.com/${objectName}`;
  }

  /**
   * 从 URL 中提取文件扩展名
   * @param url 文件 URL
   * @returns 文件扩展名
   */
  private getFileExtension(url: string): string | null {
    try {
      // 移除查询参数
      const cleanUrl = url.split('?')[0];
      // 获取最后一个点后的内容
      const parts = cleanUrl.split('.');
      if (parts.length > 1) {
        const ext = parts[parts.length - 1].toLowerCase();
        // 验证是否为常见图片格式
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
          return ext;
        }
      }
    } catch (error) {
      console.warn('无法从 URL 提取文件扩展名:', error);
    }
    return null;
  }

  /**
   * 生成预签名上传 URL（可选功能，供前端直传使用）
   * @param key 对象键名
   * @param expires 过期时间（秒），默认 3600
   * @returns 预签名 URL
   */
  async generatePresignedPutUrl(key: string, expires: number = 3600): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('阿里云 OSS 服务未初始化');
    }

    try {
      const url = this.client!.signatureUrl(key, {
        method: 'PUT',
        expires,
      });
      return url;
    } catch (error) {
      console.error('生成预签名 URL 失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const aliOSSService = new AliOSSService();