import { VideoProvider } from "./types";
import { FalProvider } from "./FalProvider";
import { VolcanoProvider } from "./VolcanoProvider";
import { getVideoModel, VideoModelProvider } from "@/config/video-models";

export class ProviderFactory {
  private static instances: Map<string, VideoProvider> = new Map();

  static getProvider(modelId: string): VideoProvider {
    const modelConfig = getVideoModel(modelId);
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const providerKey = modelConfig.provider;
    
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
          throw new Error("ARK_API_KEY environment variable is required for Volcano Engine models");
        }
        provider = new VolcanoProvider(volcanoApiKey);
        break;

      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    // Cache the instance
    this.instances.set(providerKey, provider);
    
    return provider;
  }

  static clearCache(): void {
    this.instances.clear();
  }
}