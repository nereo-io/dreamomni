/**
 * AI服务管理器
 * 统一管理多个AI服务提供商
 */

import { BaseAIProvider, ProviderFactory, GenerateImageRequest, EditImageRequest, ProviderResponse } from './providers/BaseAIProvider';
import { NanoBananaProvider } from './providers/NanoBananaProvider';
import type { AIServiceProvider, AIProviderConfig } from '@/types/provider.d';

// 预定义的提供商配置
const PROVIDER_CONFIGS: Record<AIServiceProvider, AIProviderConfig> = {
  nano_banana: {
    id: 'nano_banana',
    name: 'nano-banana',
    displayName: 'Kie.ai Nano Banana',
    description: 'High-quality AI image generation service',
    apiEndpoint: 'https://api.kie.ai',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: true,
      inpainting: false,
      outpainting: false,
      upscaling: false,
      backgroundRemoval: false,
      styleTransfer: false,
      batchGeneration: false,
      asyncCallback: true,
      realTimeStatus: false
    },
    models: [
      {
        id: 'google/nano-banana',
        name: 'nano-banana',
        displayName: 'Nano Banana',
        provider: 'nano_banana',
        type: 'text-to-image',
        status: 'active',
        features: ['text-to-image', 'high-quality'],
        maxImageCount: 1,
        maxResolution: { width: 1024, height: 1024 },
        supportedAspectRatios: ['1:1', '16:9', '9:16'],
        supportedFormats: ['jpg', 'png'],
        credits: 1
      },
      {
        id: 'nano-banana-edit',
        name: 'nano-banana-edit',
        displayName: 'Nano Banana Edit',
        provider: 'nano_banana',
        type: 'image-edit',
        status: 'active',
        features: ['image-edit', 'high-quality'],
        maxImageCount: 1,
        maxResolution: { width: 1024, height: 1024 },
        supportedAspectRatios: ['1:1'],
        supportedFormats: ['jpg', 'png'],
        credits: 2
      }
    ],
    pricing: {
      baseCredits: 1,
      qualityMultiplier: {
        standard: 1,
        high: 1.5,
        ultra: 2
      }
    }
  },
  openai: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI DALL-E',
    description: 'OpenAI DALL-E image generation',
    apiEndpoint: 'https://api.openai.com/v1/images/generations',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: false,
      imageEdit: true,
      inpainting: false,
      outpainting: false,
      upscaling: false,
      backgroundRemoval: false,
      styleTransfer: false,
      batchGeneration: false,
      asyncCallback: false,
      realTimeStatus: true
    },
    models: [
      {
        id: 'dall-e-3',
        name: 'dall-e-3',
        displayName: 'DALL-E 3',
        provider: 'openai',
        type: 'text-to-image',
        status: 'active',
        features: ['text-to-image', 'high-quality'],
        maxImageCount: 1,
        maxResolution: { width: 1792, height: 1792 },
        supportedAspectRatios: ['1:1', '1792:1024', '1024:1792'],
        supportedFormats: ['png'],
        credits: 3
      }
    ],
    pricing: {
      baseCredits: 3,
      qualityMultiplier: {
        standard: 1,
        high: 1.5,
        ultra: 2
      }
    }
  },
  midjourney: {
    id: 'midjourney',
    name: 'midjourney',
    displayName: 'Midjourney',
    description: 'High-quality artistic AI image generation',
    status: 'inactive',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: false,
      inpainting: false,
      outpainting: false,
      upscaling: true,
      backgroundRemoval: false,
      styleTransfer: true,
      batchGeneration: true,
      asyncCallback: true,
      realTimeStatus: false
    },
    models: [],
    pricing: {
      baseCredits: 2
    }
  },
  stable_diffusion: {
    id: 'stable_diffusion',
    name: 'stable-diffusion',
    displayName: 'Stability AI',
    description: 'Open-source diffusion models',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: true,
      inpainting: true,
      outpainting: true,
      upscaling: true,
      backgroundRemoval: false,
      styleTransfer: false,
      batchGeneration: true,
      asyncCallback: false,
      realTimeStatus: true
    },
    models: [
      {
        id: 'sd-xl-1.0',
        name: 'stable-diffusion-xl',
        displayName: 'Stable Diffusion XL',
        provider: 'stable_diffusion',
        type: 'text-to-image',
        status: 'active',
        features: ['text-to-image', 'high-quality'],
        maxImageCount: 4,
        maxResolution: { width: 1024, height: 1024 },
        supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        supportedFormats: ['png', 'jpg'],
        credits: 1
      }
    ],
    pricing: {
      baseCredits: 1
    }
  },
  replicate: {
    id: 'replicate',
    name: 'replicate',
    displayName: 'Replicate',
    description: 'Run open-source models in the cloud',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: true,
      inpainting: true,
      outpainting: true,
      upscaling: true,
      backgroundRemoval: true,
      styleTransfer: true,
      batchGeneration: false,
      asyncCallback: true,
      realTimeStatus: true
    },
    models: [],
    pricing: {
      baseCredits: 1
    }
  },
  huggingface: {
    id: 'huggingface',
    name: 'huggingface',
    displayName: 'Hugging Face',
    description: 'Open-source model hub',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: false,
      inpainting: false,
      outpainting: false,
      upscaling: false,
      backgroundRemoval: false,
      styleTransfer: false,
      batchGeneration: false,
      asyncCallback: false,
      realTimeStatus: true
    },
    models: [],
    pricing: {
      baseCredits: 1
    }
  },
  custom: {
    id: 'custom',
    name: 'custom',
    displayName: 'Custom Provider',
    description: 'Custom AI service provider',
    status: 'active',
    features: {
      textToImage: true,
      imageToImage: true,
      imageEdit: true,
      inpainting: false,
      outpainting: false,
      upscaling: false,
      backgroundRemoval: false,
      styleTransfer: false,
      batchGeneration: false,
      asyncCallback: true,
      realTimeStatus: false
    },
    models: [],
    pricing: {
      baseCredits: 1
    }
  }
};

export class AIServiceManager {
  private static instance: AIServiceManager;
  private providers: Map<AIServiceProvider, BaseAIProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 初始化提供商
   */
  private initializeProviders(): void {
    // 注册Nano Banana提供商
    try {
      const nanoBananaProvider = new NanoBananaProvider();
      this.providers.set('nano_banana', nanoBananaProvider);
      console.log('✅ Nano Banana provider initialized');
    } catch (error) {
      console.warn('⚠️ Nano Banana provider initialization failed:', error);
    }

    // TODO: 注册其他提供商
    // const openaiProvider = new OpenAIProvider();
    // this.providers.set('openai', openaiProvider);
  }

  /**
   * 获取提供商实例
   */
  getProvider(provider: AIServiceProvider): BaseAIProvider | null {
    return this.providers.get(provider) || null;
  }

  /**
   * 获取所有可用的提供商
   */
  getAvailableProviders(): AIServiceProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取提供商配置
   */
  getProviderConfig(provider: AIServiceProvider): AIProviderConfig | null {
    return PROVIDER_CONFIGS[provider] || null;
  }

  /**
   * 获取所有提供商配置
   */
  getAllProviderConfigs(): Record<AIServiceProvider, AIProviderConfig> {
    return PROVIDER_CONFIGS;
  }

  /**
   * 获取指定提供商的可用模型
   */
  getProviderModels(provider: AIServiceProvider) {
    const config = this.getProviderConfig(provider);
    return config?.models.filter(model => model.status === 'active') || [];
  }

  /**
   * 根据模型ID获取提供商
   */
  getProviderByModelId(modelId: string): AIServiceProvider | null {
    for (const [provider, config] of Object.entries(PROVIDER_CONFIGS)) {
      if (config.models.some(model => model.id === modelId)) {
        return provider as AIServiceProvider;
      }
    }
    return null;
  }

  /**
   * 生成图片
   */
  async generateImage(provider: AIServiceProvider, request: GenerateImageRequest): Promise<ProviderResponse> {
    const providerInstance = this.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not available`);
    }

    return await providerInstance.generateImage(request);
  }

  /**
   * 编辑图片
   */
  async editImage(provider: AIServiceProvider, request: EditImageRequest): Promise<ProviderResponse> {
    const providerInstance = this.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not available`);
    }

    if (!providerInstance.supportsFeature('imageEdit')) {
      throw new Error(`Provider ${provider} does not support image editing`);
    }

    return await providerInstance.editImage(request);
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(provider: AIServiceProvider, taskId: string): Promise<ProviderResponse> {
    const providerInstance = this.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not available`);
    }

    return await providerInstance.getTaskStatus(taskId);
  }

  /**
   * 处理回调
   */
  async handleCallback(provider: AIServiceProvider, callbackData: any): Promise<ProviderResponse> {
    const providerInstance = this.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not available`);
    }

    return await providerInstance.handleCallback(callbackData);
  }

  /**
   * 健康检查所有提供商
   */
  async healthCheckAll(): Promise<Record<AIServiceProvider, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [provider, instance] of this.providers.entries()) {
      try {
        results[provider] = await instance.healthCheck();
      } catch (error) {
        console.error(`Health check failed for ${provider}:`, error);
        results[provider] = false;
      }
    }
    
    return results as Record<AIServiceProvider, boolean>;
  }

  /**
   * 计算生成所需积分
   */
  calculateCredits(provider: AIServiceProvider, request: GenerateImageRequest | EditImageRequest): number {
    const providerInstance = this.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not available`);
    }

    return providerInstance.calculateCredits(request);
  }

  /**
   * 根据功能筛选提供商
   */
  getProvidersByFeature(feature: keyof AIProviderConfig['features']): AIServiceProvider[] {
    return Object.entries(PROVIDER_CONFIGS)
      .filter(([_, config]) => config.features[feature] && config.status === 'active')
      .map(([provider, _]) => provider as AIServiceProvider);
  }

  /**
   * 获取推荐的提供商（基于功能和可用性）
   */
  getRecommendedProvider(mode: 'text-to-image' | 'image-edit' | 'image-to-image'): AIServiceProvider | null {
    const featureMap = {
      'text-to-image': 'textToImage' as const,
      'image-edit': 'imageEdit' as const,
      'image-to-image': 'imageToImage' as const,
    };

    const feature = featureMap[mode];
    const availableProviders = this.getProvidersByFeature(feature);
    
    // 返回第一个可用的提供商，或者根据优先级排序
    const priorityOrder: AIServiceProvider[] = ['nano_banana', 'openai', 'stable_diffusion', 'replicate'];
    
    for (const provider of priorityOrder) {
      if (availableProviders.includes(provider) && this.providers.has(provider)) {
        return provider;
      }
    }
    
    return availableProviders.length > 0 ? availableProviders[0] : null;
  }
}

// 导出单例实例
export const aiServiceManager = AIServiceManager.getInstance();
