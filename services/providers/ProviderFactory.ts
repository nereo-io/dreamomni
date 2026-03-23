import { VideoProvider } from "./types";
import { FalProvider } from "./FalProvider";
import { VolcanoProvider } from "./VolcanoProvider";
import { BytePlusProvider } from "./BytePlusProvider";
import { Veo3Provider } from "./Veo3Provider";
import { KieAiVeo3Provider } from "./KieAiVeo3Provider";
import { KieAiSoraProvider } from "./KieAiSoraProvider";
import { KieAiKlingProvider } from "./KieAiKlingProvider";
import { KieAiHailuoProvider } from "./KieAiHailuoProvider";
import { KieAiWanProvider } from "./KieAiWanProvider";
import { AliProvider } from "./AliProvider";
import { EvolinkSoraProvider } from "./EvolinkSoraProvider";
import { MaxApiProvider } from "./MaxApiProvider";
import {
  getVideoModel,
  VideoModel,
  VideoModelProvider,
  isSora2Model,
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
        switch (this.getKieProviderVariant(modelId)) {
          case "sora2":
            provider = new KieAiSoraProvider(kieaiApiKey);
            break;
          case "kling3":
            provider = new KieAiKlingProvider(kieaiApiKey);
            break;
          case "hailuo23":
            provider = new KieAiHailuoProvider(kieaiApiKey);
            break;
          case "wan25":
            provider = new KieAiWanProvider(kieaiApiKey);
            break;
          case "veo3":
          default:
            // Default to Veo3 for backward compatibility
            provider = new KieAiVeo3Provider(kieaiApiKey);
            break;
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

      case VideoModelProvider.MAXAPI:
        const maxApiKey = process.env.MAXAPI_API_KEY;
        if (!maxApiKey) {
          throw new Error(
            "MAXAPI_API_KEY environment variable is required for MaxAPI models"
          );
        }
        provider = new MaxApiProvider(maxApiKey);
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
      return `${provider}:${this.getKieProviderVariant(modelId)}`;
    }

    return provider;
  }

  private static getKieProviderVariant(
    modelId: string
  ): "sora2" | "veo3" | "kling3" | "hailuo23" | "wan25" | string {
    const modelConfig = getVideoModel(modelId);

    switch (modelConfig?.modelName) {
      case VideoModel.SORA2:
        return "sora2";
      case VideoModel.KLING3:
        return "kling3";
      case VideoModel.HAILUO_2_3:
        return "hailuo23";
      case VideoModel.WAN_2_5:
        return "wan25";
      case VideoModel.VEO3:
        return "veo3";
      default:
        // Keep backward compatibility with legacy IDs that might not set modelName.
        return isSora2Model(modelId) ? "sora2" : modelId;
    }
  }

  static clearCache(): void {
    this.instances.clear();
  }
}
