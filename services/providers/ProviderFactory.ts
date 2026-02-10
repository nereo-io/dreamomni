import { VideoProvider } from "./types";
import { FalProvider } from "./FalProvider";
import { VolcanoProvider } from "./VolcanoProvider";
import { BytePlusProvider } from "./BytePlusProvider";
import { Veo3Provider } from "./Veo3Provider";
import { KieAiVeo3Provider } from "./KieAiVeo3Provider";
import { KieAiSoraProvider } from "./KieAiSoraProvider";
import { AliProvider } from "./AliProvider";
import { EvolinkSoraProvider } from "./EvolinkSoraProvider";
import {
  getVideoModel,
  VideoModelProvider,
  isSora2Model,
  isKieAiVeo3Model,
} from "@/config/video-models";

export class ProviderFactory {
  private static instances: Map<string, VideoProvider> = new Map();

  static getProvider(modelId: string): VideoProvider {
    const modelConfig = getVideoModel(modelId);
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const providerKey = this.getProviderCacheKey(modelConfig.provider, modelId);

    // Return cached instance if available
    if (this.instances.has(providerKey)) {
      return this.instances.get(providerKey)!;
    }

    let provider: VideoProvider;

    switch (modelConfig.provider) {
      case VideoModelProvider.FAL:
        provider = new FalProvider();
        break;

      case VideoModelProvider.VOLCANO:
        const volcanoApiKey = process.env.ARK_API_KEY;
        if (!volcanoApiKey) {
          throw new Error(
            "ARK_API_KEY environment variable is required for Volcano Engine models"
          );
        }
        provider = new VolcanoProvider(volcanoApiKey);
        break;

      case VideoModelProvider.BYTEPLUS:
        const byteplusApiKey = process.env.BYTEPLUS_API_KEY;
        if (!byteplusApiKey) {
          throw new Error(
            "BYTEPLUS_API_KEY environment variable is required for BytePlus models"
          );
        }
        provider = new BytePlusProvider(byteplusApiKey);
        break;

      case VideoModelProvider.APICORE:
        const apicoreApiKey = process.env.APICORE_API_KEY;
        if (!apicoreApiKey) {
          throw new Error(
            "APICORE_API_KEY environment variable is required for APICore models"
          );
        }
        provider = new Veo3Provider(apicoreApiKey);
        break;

      case VideoModelProvider.KIEAI:
        const kieaiApiKey = process.env.KIE_AI_API_KEY;
        if (!kieaiApiKey) {
          throw new Error(
            "KIE_AI_API_KEY environment variable is required for Kie.ai models"
          );
        }
        // Route to different providers based on model type
        if (isSora2Model(modelId)) {
          provider = new KieAiSoraProvider(kieaiApiKey);
        } else if (isKieAiVeo3Model(modelId)) {
          provider = new KieAiVeo3Provider(kieaiApiKey);
        } else {
          // Default to Veo3 for backward compatibility
          provider = new KieAiVeo3Provider(kieaiApiKey);
        }
        break;

      case VideoModelProvider.ALI:
        const aliApiKey = process.env.ALI_API_KEY;
        if (!aliApiKey) {
          throw new Error(
            "ALI_API_KEY environment variable is required for Ali models"
          );
        }
        provider = new AliProvider(aliApiKey);
        break;

      case VideoModelProvider.EVOLINK:
        const evolinkApiKey = process.env.EVOLINK_API_KEY;
        if (!evolinkApiKey) {
          throw new Error(
            "EVOLINK_API_KEY environment variable is required for Evolink models"
          );
        }
        provider = new EvolinkSoraProvider(evolinkApiKey);
        break;

      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    // Cache the instance
    this.instances.set(providerKey, provider);

    return provider;
  }

  private static getProviderCacheKey(
    provider: VideoModelProvider,
    modelId: string
  ): string {
    if (provider === VideoModelProvider.KIEAI) {
      if (isSora2Model(modelId)) {
        return `${provider}:sora2`;
      }

      if (isKieAiVeo3Model(modelId)) {
        return `${provider}:veo3`;
      }

      return `${provider}:${modelId}`;
    }

    return provider;
  }

  static clearCache(): void {
    this.instances.clear();
  }
}
