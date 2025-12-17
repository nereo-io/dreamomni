/**
 * 基础AI服务提供商抽象类
 * Base AI Provider Abstract Class
 */

import type {
  AIServiceProvider,
  ProviderTaskResponse,
  ProviderImageResult,
  AIProviderModel,
  AIProviderConfig
} from "@/types/provider.d";
import { getMaxPromptLength } from "@/config/image-models";

export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
  seed?: number;
  count?: number;
  width?: number;
  height?: number;
  output_format?: "png" | "jpeg";

  // 标准 API 宽高比字段 (兼容旧版)
  // 注: 建议使用 aspect_ratio 字段,image_size 将来会被废弃
  image_size?: "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9";

  metadata?: Record<string, any>;

  // Pro 模型参数 (Nano Banana Pro 等)
  // 注: 具体支持的值定义在 config/image-models.ts
  aspect_ratio?: string;  // 宽高比,如 '16:9', '1:1' 等
  resolution?: string;     // 分辨率,如 '1K', '2K', '4K' 等
  image_input?: string[];  // 用于图生图(替代 EditImageRequest 中的 imageUrls)
}

export interface EditImageRequest {
  prompt: string;
  imageUrls: string[];
  negativePrompt?: string;
  model?: string;
  strength?: number; // 0.0 - 1.0
  seed?: number;
  output_format?: "png" | "jpeg";
  image_size?: "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9";
  metadata?: Record<string, any>;

  // Pro 模型参数 (与 GenerateImageRequest 保持一致)
  aspect_ratio?: string;  // 宽高比,如 '16:9', '1:1' 等
  resolution?: string;     // 分辨率,如 '1K', '2K', '4K' 等
}

export interface ProviderResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  images?: ProviderImageResult[];
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseAIProvider {
  protected provider: AIServiceProvider;
  protected config: AIProviderConfig;
  protected apiKey?: string;

  constructor(provider: AIServiceProvider, config: AIProviderConfig, apiKey?: string) {
    this.provider = provider;
    this.config = config;
    this.apiKey = apiKey;
  }

  /**
   * 获取提供商信息
   */
  getProvider(): AIServiceProvider {
    return this.provider;
  }

  /**
   * 获取提供商配置
   */
  getConfig(): AIProviderConfig {
    return this.config;
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): AIProviderModel[] {
    return this.config.models.filter(model => model.status === 'active');
  }

  /**
   * 根据ID获取模型配置
   */
  getModelById(modelId: string): AIProviderModel | null {
    return this.config.models.find(model => model.id === modelId) || null;
  }

  /**
   * 检查提供商是否支持指定功能
   */
  supportsFeature(feature: keyof typeof this.config.features): boolean {
    return Boolean(this.config.features[feature]);
  }

  /**
   * 生成回调URL
   */
  protected getCallbackUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    return `${baseUrl}/api/ai-callback/${this.provider}`;
  }

  /**
   * 验证请求参数
   */
  protected validateRequest(request: GenerateImageRequest | EditImageRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    // 动态获取模型配置来验证参数
    const modelId = 'model' in request ? request.model : undefined;
    const modelConfig = modelId ? this.getModelById(modelId) : null;

    // 根据模型配置确定提示词最大长度（从统一配置获取）
    const maxLength = modelId ? getMaxPromptLength(modelId) : 5000;
    if (request.prompt.length > maxLength) {
      throw new Error(`Prompt is too long (max ${maxLength} characters)`);
    }

    // 如果有模型配置,使用配置中的限制进行验证
    if (modelConfig && 'image_input' in request && request.image_input) {
      // 注: 这里使用硬编码 8 是因为 AIProviderModel 接口没有 maxInputImages 字段
      // 实际限制在 config/image-models.ts 中定义
      const maxImages = modelId === 'nano-banana-pro' ? 8 : 5;
      if (request.image_input.length > maxImages) {
        throw new Error(`Model supports maximum ${maxImages} input images`);
      }
    }

    // 宽高比验证 (如果提供了)
    if ('aspect_ratio' in request && request.aspect_ratio && modelConfig) {
      const validRatios = modelConfig.supportedAspectRatios || [];
      if (validRatios.length > 0 && !validRatios.includes(request.aspect_ratio)) {
        throw new Error(`Invalid aspect ratio. Supported: ${validRatios.join(', ')}`);
      }
    }

    // 分辨率验证 (Pro 模型特定)
    if ('resolution' in request && request.resolution && modelId === 'nano-banana-pro') {
      // 注: 这里仍需硬编码,因为 AIProviderModel 没有 supportedResolutions 字段
      const validResolutions = ['1K', '2K', '4K'];
      if (!validResolutions.includes(request.resolution)) {
        throw new Error(`Invalid resolution. Supported: ${validResolutions.join(', ')}`);
      }
    }
  }

  /**
   * 计算生成所需积分
   */
  calculateCredits(request: GenerateImageRequest | EditImageRequest): number {
    const model = request.model ? this.getModelById(request.model) : this.getAvailableModels()[0];
    if (!model) {
      throw new Error('No available model found');
    }

    let credits = model.credits;
    
    // 根据质量调整积分
    if ('quality' in request && request.quality === 'high') {
      credits *= 1.5;
    } else if ('quality' in request && request.quality === 'ultra') {
      credits *= 2;
    }
    
    // 根据数量调整积分
    if ('count' in request && request.count && request.count > 1) {
      credits *= request.count;
    }
    
    return Math.ceil(credits);
  }

  /**
   * 生成图片 - 抽象方法，由具体提供商实现
   */
  abstract generateImage(request: GenerateImageRequest): Promise<ProviderResponse>;

  /**
   * 编辑图片 - 抽象方法，由具体提供商实现
   */
  abstract editImage(request: EditImageRequest): Promise<ProviderResponse>;

  /**
   * 查询任务状态 - 抽象方法，由具体提供商实现
   */
  abstract getTaskStatus(taskId: string): Promise<ProviderResponse>;

  /**
   * 取消任务 - 可选实现
   */
  async cancelTask(taskId: string): Promise<boolean> {
    console.warn(`Cancel task not implemented for provider: ${this.provider}`);
    return false;
  }

  /**
   * 处理回调数据 - 可选实现
   */
  async handleCallback(callbackData: any): Promise<ProviderResponse> {
    throw new Error(`Callback handling not implemented for provider: ${this.provider}`);
  }

  /**
   * 健康检查 - 可选实现
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 默认实现：尝试获取模型列表
      const models = this.getAvailableModels();
      return models.length > 0;
    } catch (error) {
      console.error(`Health check failed for provider ${this.provider}:`, error);
      return false;
    }
  }
}

/**
 * 提供商工厂类
 */
export class ProviderFactory {
  private static providers: Map<AIServiceProvider, new (provider: AIServiceProvider, config: AIProviderConfig, apiKey?: string) => BaseAIProvider> = new Map();
  private static configs: Map<AIServiceProvider, AIProviderConfig> = new Map();

  /**
   * 注册提供商
   */
  static registerProvider(
    provider: AIServiceProvider, 
    providerClass: new (provider: AIServiceProvider, config: AIProviderConfig, apiKey?: string) => BaseAIProvider,
    config: AIProviderConfig
  ): void {
    this.providers.set(provider, providerClass);
    this.configs.set(provider, config);
  }

  /**
   * 创建提供商实例
   */
  static createProvider(provider: AIServiceProvider, apiKey?: string): BaseAIProvider {
    const ProviderClass = this.providers.get(provider);
    const config = this.configs.get(provider);
    
    if (!ProviderClass || !config) {
      throw new Error(`Provider ${provider} not registered`);
    }
    
    return new ProviderClass(provider, config, apiKey);
  }

  /**
   * 获取所有已注册的提供商
   */
  static getRegisteredProviders(): AIServiceProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取提供商配置
   */
  static getProviderConfig(provider: AIServiceProvider): AIProviderConfig | null {
    return this.configs.get(provider) || null;
  }
}
