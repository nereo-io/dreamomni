import type {
  MusicGenerationType,
  SubmitMusicGenerationRequest,
  VocalGender,
} from '@/types/music.d';

/**
 * 参数验证错误
 */
export class MusicParamsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MusicParamsValidationError';
  }
}

/**
 * 音乐生成参数验证器
 */
export class MusicParamsValidator {
  
  /**
   * 验证提交参数（主入口）
   */
  static validate(params: SubmitMusicGenerationRequest): void {
    const {
      generationType = 'direct',
      customMode = true,
      instrumental = false,
    } = params;
    
    // 1. 验证 generationType
    this.validateGenerationType(generationType);
    
    // 2. 根据 generationType 验证必填参数
    switch (generationType) {
      case 'direct':
        this.validateDirectGeneration(params, customMode, instrumental);
        break;
      
      case 'add-vocals':
        this.validateAddVocals(params);
        break;
      
      case 'add-instrumental':
        this.validateAddInstrumental(params);
        break;
      
      case 'upload-cover':
        this.validateUploadCover(params, customMode, instrumental);
        break;
      
      default:
        throw new MusicParamsValidationError(`Unsupported generation type: ${generationType}`);
    }
    
    // 3. 验证通用参数（所有接口）
    this.validateCommonParams(params);
  }
  
  /**
   * 验证 generationType
   */
  private static validateGenerationType(type: MusicGenerationType): void {
    const validTypes: MusicGenerationType[] = ['direct', 'add-vocals', 'add-instrumental', 'upload-cover'];
    if (!validTypes.includes(type)) {
      throw new MusicParamsValidationError(`Invalid generation type: ${type}`);
    }
  }
  
  /**
   * 验证 Direct Generation（直接生成）
   */
  private static validateDirectGeneration(
    params: SubmitMusicGenerationRequest,
    customMode: boolean,
    instrumental: boolean
  ): void {
    const { prompt, title, style } = params;
    
    if (customMode) {
      // 自定义模式
      if (instrumental) {
        // Instrumental 模式（纯音乐）
        if (!style || style.trim() === '') {
          throw new MusicParamsValidationError('style is required for Instrumental mode in custom mode');
        }
        if (!title || title.trim() === '') {
          throw new MusicParamsValidationError('title is required for Instrumental mode in custom mode');
        }
      } else {
        // Song 模式（有人声）
        if (!style || style.trim() === '') {
          throw new MusicParamsValidationError('style is required for Song mode in custom mode');
        }
        if (!title || title.trim() === '') {
          throw new MusicParamsValidationError('title is required for Song mode in custom mode');
        }
        if (!prompt || prompt.trim() === '') {
          throw new MusicParamsValidationError('prompt is required for Song mode in custom mode');
        }
      }
    } else {
      // 简化模式
      if (!prompt || prompt.trim() === '') {
        throw new MusicParamsValidationError('prompt is required in non-custom mode');
      }
    }
    
    // 验证 prompt 长度
    if (prompt) {
      const maxLength = customMode ? 5000 : 500;
      if (prompt.length > maxLength) {
        throw new MusicParamsValidationError(`prompt exceeds maximum length of ${maxLength} characters`);
      }
    }
    
    // 验证 style 长度
    if (style && style.length > 1000) {
      throw new MusicParamsValidationError('style exceeds maximum length of 1000 characters');
    }
    
    // 验证 title 长度
    if (title && title.length > 80) {
      throw new MusicParamsValidationError('title exceeds maximum length of 80 characters');
    }
  }
  
  /**
   * 验证 Add Vocals（添加人声）
   */
  private static validateAddVocals(params: SubmitMusicGenerationRequest): void {
    const { uploadAudioUrl, prompt, title, style, negativeTags } = params;
    
    // 必填参数
    if (!uploadAudioUrl || uploadAudioUrl.trim() === '') {
      throw new MusicParamsValidationError('uploadAudioUrl is required for add-vocals mode');
    }
    
    if (!prompt || prompt.trim() === '') {
      throw new MusicParamsValidationError('prompt is required for add-vocals mode');
    }
    
    if (!title || title.trim() === '') {
      throw new MusicParamsValidationError('title is required for add-vocals mode');
    }
    
    if (!style || style.trim() === '') {
      throw new MusicParamsValidationError('style is required for add-vocals mode');
    }
    
    if (!negativeTags || negativeTags.trim() === '') {
      throw new MusicParamsValidationError('negativeTags is required for add-vocals mode');
    }
    
    // 验证 URL 格式
    this.validateUrl(uploadAudioUrl, 'uploadAudioUrl');
  }
  
  /**
   * 验证 Add Instrumental（添加伴奏）
   */
  private static validateAddInstrumental(params: SubmitMusicGenerationRequest): void {
    const { uploadAudioUrl, title, style, negativeTags } = params;
    
    // 必填参数
    if (!uploadAudioUrl || uploadAudioUrl.trim() === '') {
      throw new MusicParamsValidationError('uploadAudioUrl is required for add-instrumental mode');
    }
    
    if (!title || title.trim() === '') {
      throw new MusicParamsValidationError('title is required for add-instrumental mode');
    }
    
    if (!style || style.trim() === '') {
      throw new MusicParamsValidationError('style (tags) is required for add-instrumental mode');
    }
    
    if (!negativeTags || negativeTags.trim() === '') {
      throw new MusicParamsValidationError('negativeTags is required for add-instrumental mode');
    }
    
    // 验证 URL 格式
    this.validateUrl(uploadAudioUrl, 'uploadAudioUrl');
  }
  
  /**
   * 验证 Upload Cover（上传翻唱）
   */
  private static validateUploadCover(
    params: SubmitMusicGenerationRequest,
    customMode: boolean,
    instrumental: boolean
  ): void {
    const { uploadAudioUrl, prompt, title, style } = params;
    
    // uploadUrl 必填
    if (!uploadAudioUrl || uploadAudioUrl.trim() === '') {
      throw new MusicParamsValidationError('uploadAudioUrl is required for upload-cover mode');
    }
    
    // 验证 URL 格式
    this.validateUrl(uploadAudioUrl, 'uploadAudioUrl');
    
    if (customMode) {
      // 自定义模式
      if (instrumental) {
        // Instrumental 模式
        if (!style || style.trim() === '') {
          throw new MusicParamsValidationError('style is required for upload-cover Instrumental mode in custom mode');
        }
        if (!title || title.trim() === '') {
          throw new MusicParamsValidationError('title is required for upload-cover Instrumental mode in custom mode');
        }
      } else {
        // Song 模式
        if (!style || style.trim() === '') {
          throw new MusicParamsValidationError('style is required for upload-cover Song mode in custom mode');
        }
        if (!title || title.trim() === '') {
          throw new MusicParamsValidationError('title is required for upload-cover Song mode in custom mode');
        }
        if (!prompt || prompt.trim() === '') {
          throw new MusicParamsValidationError('prompt is required for upload-cover Song mode in custom mode');
        }
      }
    } else {
      // 简化模式
      if (!prompt || prompt.trim() === '') {
        throw new MusicParamsValidationError('prompt is required for upload-cover non-custom mode');
      }
    }
  }
  
  /**
   * 验证通用参数（所有接口）
   */
  private static validateCommonParams(params: SubmitMusicGenerationRequest): void {
    const {
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      modelId,
    } = params;
    
    // 验证 vocalGender
    if (vocalGender && !['m', 'f'].includes(vocalGender)) {
      throw new MusicParamsValidationError('vocalGender must be "m" or "f"');
    }
    
    // 验证权重参数（0-1，最多2位小数）
    if (styleWeight !== undefined) {
      this.validateWeight(styleWeight, 'styleWeight');
    }
    
    if (weirdnessConstraint !== undefined) {
      this.validateWeight(weirdnessConstraint, 'weirdnessConstraint');
    }
    
    if (audioWeight !== undefined) {
      this.validateWeight(audioWeight, 'audioWeight');
    }
  }
  
  /**
   * 验证权重参数（0-1，最多2位小数）
   */
  private static validateWeight(value: number, name: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new MusicParamsValidationError(`${name} must be a number`);
    }
    
    if (value < 0 || value > 1) {
      throw new MusicParamsValidationError(`${name} must be between 0 and 1`);
    }
    
    // 验证最多2位小数
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new MusicParamsValidationError(`${name} must have at most 2 decimal places`);
    }
  }
  
  /**
   * 验证 URL 格式
   */
  private static validateUrl(url: string, name: string): void {
    try {
      new URL(url);
    } catch {
      throw new MusicParamsValidationError(`${name} must be a valid URL`);
    }
  }
}
