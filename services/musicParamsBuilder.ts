import type {
  MusicGenerationType,
  SubmitMusicGenerationRequest,
} from '@/types/music.d';
import { getMusicModel } from '@/config/music-models';

/**
 * Provider API 参数类型（Kie.ai Suno）
 */

export interface GenerateMusicParams {
  prompt: string;
  customMode: boolean;
  instrumental: boolean;
  model: string;
  callBackUrl: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface AddVocalsParams {
  uploadUrl: string;
  prompt: string;
  title: string;
  style: string;
  negativeTags: string;
  model: string;
  callBackUrl: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface AddInstrumentalParams {
  uploadUrl: string;
  title: string;
  tags: string;
  negativeTags: string;
  callBackUrl: string;
  model?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface UploadCoverParams {
  uploadUrl: string;
  customMode: boolean;
  instrumental: boolean;
  model: string;
  callBackUrl: string;
  title?: string;
  style?: string;
  prompt?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export type ProviderParams = 
  | GenerateMusicParams 
  | AddVocalsParams 
  | AddInstrumentalParams 
  | UploadCoverParams;

/**
 * 音乐生成参数构建器
 */
export class MusicParamsBuilder {
  
  /**
   * 构建 Provider API 参数（主入口）
   */
  static buildProviderParams(
    params: SubmitMusicGenerationRequest,
    webhookUrl: string
  ): ProviderParams {
    const {
      generationType = 'direct',
      modelId = 'suno-v5',
    } = params;
    
    const modelConfig = getMusicModel(modelId);
    if (!modelConfig) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    
    const modelVersion = modelConfig.modelVersion;
    
    switch (generationType) {
      case 'direct':
        return this.buildGenerateMusicParams(params, modelVersion, webhookUrl);
      
      case 'add-vocals':
        return this.buildAddVocalsParams(params, modelVersion, webhookUrl);
      
      case 'add-instrumental':
        return this.buildAddInstrumentalParams(params, modelVersion, webhookUrl);
      
      case 'upload-cover':
        return this.buildUploadCoverParams(params, modelVersion, webhookUrl);
      
      default:
        throw new Error(`Unsupported generation type: ${generationType}`);
    }
  }
  
  /**
   * 构建 Generate Music 参数
   */
  private static buildGenerateMusicParams(
    params: SubmitMusicGenerationRequest,
    modelVersion: string,
    webhookUrl: string
  ): GenerateMusicParams {
    const {
      prompt,
      customMode = true,
      instrumental = false,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
    } = params;
    
    const apiParams: GenerateMusicParams = {
      prompt: prompt || '',
      customMode,
      instrumental,
      model: modelVersion,
      callBackUrl: webhookUrl,
    };
    
    if (customMode) {
      if (title) apiParams.title = title;
      if (style) apiParams.style = style;
      if (negativeTags) apiParams.negativeTags = negativeTags;
      if (vocalGender) apiParams.vocalGender = vocalGender;
      if (styleWeight !== undefined) apiParams.styleWeight = styleWeight;
      if (weirdnessConstraint !== undefined) apiParams.weirdnessConstraint = weirdnessConstraint;
      if (audioWeight !== undefined) apiParams.audioWeight = audioWeight;
      if (personaId) apiParams.personaId = personaId;
    }
    
    return apiParams;
  }
  
  /**
   * 构建 Add Vocals 参数
   */
  private static buildAddVocalsParams(
    params: SubmitMusicGenerationRequest,
    modelVersion: string,
    webhookUrl: string
  ): AddVocalsParams {
    const {
      uploadAudioUrl,
      prompt,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
    } = params;
    
    const apiParams: AddVocalsParams = {
      uploadUrl: uploadAudioUrl!,
      prompt: prompt || '',
      title: title || '',
      style: style || '',
      negativeTags: negativeTags || '',
      model: modelVersion,
      callBackUrl: webhookUrl,
    };
    
    if (vocalGender) apiParams.vocalGender = vocalGender;
    if (styleWeight !== undefined) apiParams.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) apiParams.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) apiParams.audioWeight = audioWeight;
    
    return apiParams;
  }
  
  /**
   * 构建 Add Instrumental 参数
   */
  private static buildAddInstrumentalParams(
    params: SubmitMusicGenerationRequest,
    modelVersion: string,
    webhookUrl: string
  ): AddInstrumentalParams {
    const {
      uploadAudioUrl,
      title,
      style,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
    } = params;
    
    const apiParams: AddInstrumentalParams = {
      uploadUrl: uploadAudioUrl!,
      title: title || '',
      tags: style || '',
      negativeTags: negativeTags || '',
      callBackUrl: webhookUrl,
      model: modelVersion,
    };
    
    if (vocalGender) apiParams.vocalGender = vocalGender;
    if (styleWeight !== undefined) apiParams.styleWeight = styleWeight;
    if (weirdnessConstraint !== undefined) apiParams.weirdnessConstraint = weirdnessConstraint;
    if (audioWeight !== undefined) apiParams.audioWeight = audioWeight;
    
    return apiParams;
  }
  
  /**
   * 构建 Upload Cover 参数
   */
  private static buildUploadCoverParams(
    params: SubmitMusicGenerationRequest,
    modelVersion: string,
    webhookUrl: string
  ): UploadCoverParams {
    const {
      uploadAudioUrl,
      customMode = true,
      instrumental = false,
      title,
      style,
      prompt,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      personaId,
    } = params;
    
    const apiParams: UploadCoverParams = {
      uploadUrl: uploadAudioUrl!,
      customMode,
      instrumental,
      model: modelVersion,
      callBackUrl: webhookUrl,
    };
    
    if (customMode) {
      if (title) apiParams.title = title;
      if (style) apiParams.style = style;
      if (prompt) apiParams.prompt = prompt;
      if (negativeTags) apiParams.negativeTags = negativeTags;
      if (vocalGender) apiParams.vocalGender = vocalGender;
      if (styleWeight !== undefined) apiParams.styleWeight = styleWeight;
      if (weirdnessConstraint !== undefined) apiParams.weirdnessConstraint = weirdnessConstraint;
      if (audioWeight !== undefined) apiParams.audioWeight = audioWeight;
      if (personaId) apiParams.personaId = personaId;
    } else {
      if (prompt) apiParams.prompt = prompt;
    }
    
    return apiParams;
  }
}
