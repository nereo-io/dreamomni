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
  metadata?: Record<string, any>;
}

export interface EditImageRequest {
  prompt: string;
  imageUrls: string[];
  negativePrompt?: string;
  model?: string;
  strength?: number; // 0.0 - 1.0
  seed?: number;
  metadata?: Record<string, any>;
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
    
    if (request.prompt.length > 1000) {
      throw new Error('Prompt is too long (max 1000 characters)');
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
