// ========================================
// 音乐生成类型定义
// 版本: v2.0
// 日期: 2026-01-03
// ========================================

/**
 * 音乐生成类型枚举
 */
export type MusicGenerationType = 
  | 'direct'              // 直接生成（Generate Music）
  | 'add-vocals'          // 添加人声（Add Vocals）
  | 'add-instrumental'    // 添加伴奏（Add Instrumental）
  | 'upload-cover';       // 上传翻唱（Upload Cover）

/**
 * 音乐生成状态枚举
 */
export type MusicGenerationStatus = 
  | 'PENDING'                   // 已提交，等待处理
  | 'TEXT_GENERATED'            // 歌词生成完成
  | 'FIRST_TRACK_COMPLETED'     // 第一首音频完成
  | 'COMPLETED'                 // 全部完成
  | 'FAILED'                    // 生成失败
  | 'SAVED_TO_R2';              // 已保存到R2（可选）

/**
 * Webhook 回调类型枚举
 */
export type MusicWebhookCallbackType = 
  | 'text'      // 文本生成完成
  | 'first'     // 第一个曲目完成
  | 'complete'  // 所有曲目完成
  | 'error';    // 生成失败

/**
 * 人声性别枚举
 */
export type VocalGender = 'm' | 'f';

/**
 * 音乐生成记录（数据库表映射）
 */
export interface MusicGeneration {
  id: string;
  user_id: string;
  provider: string;
  model_id: string;
  provider_task_id: string | null;
  
  generation_type: MusicGenerationType;
  custom_mode: boolean;
  instrumental: boolean;
  
  prompt: string;
  title: string | null;
  style: string | null;
  negative_tags: string | null;
  
  upload_audio_url: string | null;
  
  vocal_gender: VocalGender | null;
  style_weight: number | null;
  weirdness_constraint: number | null;
  audio_weight: number | null;
  persona_id: string | null;
  
  status: MusicGenerationStatus;
  
  audio_url_provider: string | null;
  audio_url_r2: string | null;
  image_url: string | null;
  stream_audio_url: string | null;
  
  generated_tags: string | null;
  duration_seconds: number | null;
  
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  
  credits_cost: number;
  metadata: Record<string, any>;
  
  is_delete: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * 创建音乐生成记录参数
 */
export interface CreateMusicGenerationParams {
  user_id: string;
  provider: string;
  model_id: string;
  
  generation_type: MusicGenerationType;
  custom_mode: boolean;
  instrumental: boolean;
  
  prompt: string;
  title?: string;
  style?: string;
  negative_tags?: string;
  
  upload_audio_url?: string;
  
  vocal_gender?: VocalGender;
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
  persona_id?: string;
  
  status?: MusicGenerationStatus;
  credits_cost?: number;
  metadata?: Record<string, any>;
}

/**
 * 更新音乐生成记录参数
 */
export interface UpdateMusicGenerationParams {
  provider_task_id?: string;
  status?: MusicGenerationStatus;
  
  audio_url_provider?: string;
  audio_url_r2?: string;
  image_url?: string;
  stream_audio_url?: string;
  
  generated_tags?: string;
  duration_seconds?: number;
  
  error_message?: string;
  error_code?: string;
  retry_count?: number;
  
  metadata?: Record<string, any>;
  
  updated_at?: Date;
  completed_at?: Date;
}

/**
 * 提交音乐生成请求（前端 → API）
 */
export interface SubmitMusicGenerationRequest {
  // 生成模式
  generationType?: MusicGenerationType;  // 默认 'direct'
  customMode?: boolean;                  // 默认 true
  instrumental?: boolean;                // 默认 false（Song模式）
  
  // 核心参数
  prompt: string;
  title?: string;
  style?: string;
  negativeTags?: string;
  
  // Song 模式参数
  vocalGender?: VocalGender;
  
  // 音频上传（add-vocals/add-instrumental/upload-cover 模式）
  uploadAudioUrl?: string;
  
  // 模型配置
  modelId?: string;
  
  // 高级参数
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
  
  // CAPTCHA（新用户）
  captchaToken?: string;
}

/**
 * 提交音乐生成响应（API → 前端）
 */
export interface SubmitMusicGenerationResponse {
  code: number;
  message: string;
  data?: {
    id: string;
    providerTaskId: string;
    status: MusicGenerationStatus;
    userCredits: number;
    estimatedTime: number;
    provider: string;
    modelId: string;
  };
}

/**
 * 查询任务状态响应
 */
export interface MusicGenerationStatusResponse {
  code: number;
  message: string;
  data?: {
    id: string;
    status: MusicGenerationStatus;
    audioUrl?: string;
    imageUrl?: string;
    streamAudioUrl?: string;
    duration?: number;
    generatedTags?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

/**
 * 音频数据项（单个音频的详细信息）
 */
export interface MusicAudioItem {
  id: string;
  audio_url: string;
  stream_audio_url?: string;
  image_url?: string;
  prompt?: string;
  model_name: string;
  title: string;
  tags: string;
  createTime: string | number;
  duration: number;
  // upload-cover 模式独有字段
  source_audio_url?: string;
  source_stream_audio_url?: string;
  source_image_url?: string;
}

/**
 * 积分扣费信息
 */
export interface CreditDeduction {
  pools: Array<{
    deducted: number;
    order_no: string;
    expired_at: string;
  }>;
  deducted_at: string;
  total_deducted: number;
}

/**
 * Kie.ai Webhook 回调负载（原始格式）
 */
export interface KieAiMusicWebhookPayload {
  code: number;
  msg: string;
  data: {
    callbackType: MusicWebhookCallbackType;
    task_id: string;
    data: MusicAudioItem[];
  };
}

/**
 * 实际收到的 Webhook 回调负载（封装格式）
 */
export interface ActualMusicWebhookPayload {
  api_endpoint: string;
  callback_type: MusicWebhookCallbackType;
  credit_deduction?: CreditDeduction;
  provider_response: MusicAudioItem | MusicAudioItem[];
  webhook_received_at: string;
  task_id?: string;
}

/**
 * 统一的 Webhook 回调负载类型
 */
export type UnifiedMusicWebhookPayload = KieAiMusicWebhookPayload | ActualMusicWebhookPayload;
