// 音乐生成类型
export enum MusicGenerationType {
  DIRECT = "direct", // 直接生成（Song 或 Instrumental）
  ADD_VOCALS = "add-vocals", // 在伴奏上添加人声
  ADD_INSTRUMENTAL = "add-instrumental", // 在人声上添加伴奏
  UPLOAD_COVER = "upload-cover", // 改变音频风格
}

// 音乐模型提供商
export enum MusicModelProvider {
  KIEAI = "kieai", // Kie.ai 提供的 Suno API
  // 预留其他提供商扩展
}

// 音乐模型配置接口
export interface MusicModelConfig {
  id: string;
  name: string;
  provider: MusicModelProvider;
  displayName: string;
  credits: number; // 固定积分消耗
  description?: string;
  features?: string[];
  maxDuration?: number; // 最大时长（秒）
  supportedGenerationTypes?: MusicGenerationType[]; // 支持的生成类型
  estimatedGenerationTime?: number; // 预估生成时间（秒）
  modelVersion: string; // 模型版本（V4_5PLUS, V5 等）
  supportsLyrics?: boolean; // 是否支持歌词输入
  supportsInstrumental?: boolean; // 是否支持纯音乐
  supportsCustomMode?: boolean; // 是否支持自定义模式
  internal?: boolean; // 是否为内部使用模型，不在前端UI显示
}

// 音乐模型配置
export const MUSIC_MODELS: Record<string, MusicModelConfig> = {
  // Kie.ai Suno V5 模型
  "suno-v5": {
    id: "suno-v5",
    name: "Suno V5",
    provider: MusicModelProvider.KIEAI,
    displayName: "Suno V5",
    credits: 12, // 固定12积分
    description: "Superior musical expression, faster generation",
    features: ["Song Mode", "Instrumental Mode", "Faster", "Better Quality"],
    maxDuration: 480, // 8分钟
    supportedGenerationTypes: [
      MusicGenerationType.DIRECT,
      MusicGenerationType.ADD_VOCALS,
      MusicGenerationType.ADD_INSTRUMENTAL,
      MusicGenerationType.UPLOAD_COVER,
    ],
    estimatedGenerationTime: 150, // 预估2.5分钟
    modelVersion: "V5",
    supportsLyrics: true,
    supportsInstrumental: true,
    supportsCustomMode: true,
  },
};

// 辅助函数
export function getMusicModel(modelId: string): MusicModelConfig | undefined {
  return MUSIC_MODELS[modelId];
}

export function getMusicModelsByProvider(
  provider: MusicModelProvider
): MusicModelConfig[] {
  return Object.values(MUSIC_MODELS).filter(
    (model) => model.provider === provider
  );
}

export function getKieAiMusicModels(): MusicModelConfig[] {
  return getMusicModelsByProvider(MusicModelProvider.KIEAI);
}

export function getMusicModelsByGenerationType(
  generationType: MusicGenerationType
): MusicModelConfig[] {
  return Object.values(MUSIC_MODELS).filter(
    (model) =>
      model.supportedGenerationTypes?.includes(generationType) ?? false
  );
}

export function getMusicModelCredits(modelId: string): number {
  const model = getMusicModel(modelId);
  return model?.credits || 12; // 默认12积分
}

export function getMusicModelProvider(
  modelId: string
): MusicModelProvider | null {
  const model = getMusicModel(modelId);
  return model?.provider || null;
}

export function isMusicModelSupportsLyrics(modelId: string): boolean {
  const model = getMusicModel(modelId);
  return model?.supportsLyrics || false;
}

export function isMusicModelSupportsInstrumental(modelId: string): boolean {
  const model = getMusicModel(modelId);
  return model?.supportsInstrumental || false;
}

export function isMusicModelSupportsCustomMode(modelId: string): boolean {
  const model = getMusicModel(modelId);
  return model?.supportsCustomMode || false;
}

export function getSupportedMusicModelIds(): string[] {
  return Object.keys(MUSIC_MODELS);
}

export function isKieAiMusicModel(modelId: string): boolean {
  const model = getMusicModel(modelId);
  return model?.provider === MusicModelProvider.KIEAI;
}

export function getMusicModelMaxDuration(modelId: string): number {
  const model = getMusicModel(modelId);
  return model?.maxDuration || 480; // 默认8分钟
}

export function getMusicModelEstimatedTime(modelId: string): number {
  const model = getMusicModel(modelId);
  return model?.estimatedGenerationTime || 180; // 默认3分钟
}

export function getMusicModelPricing(modelId: string): {
  credits: number;
  usd: number;
} | null {
  const model = getMusicModel(modelId);
  if (!model) return null;

  return {
    credits: model.credits,
    usd: model.credits * 0.025, // 1积分 = $0.025
  };
}

// 验证生成类型是否被模型支持
export function isGenerationTypeSupported(
  modelId: string,
  generationType: MusicGenerationType
): boolean {
  const model = getMusicModel(modelId);
  return model?.supportedGenerationTypes?.includes(generationType) ?? false;
}
