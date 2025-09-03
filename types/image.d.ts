/**
 * Image Generation Types
 * 图片生成相关类型定义
 */

export type ImageGenerationStatus =
  | "PENDING"           // 待处理
  | "PROMPT_OPTIMIZING" // 提示词优化中
  | "IN_QUEUE"          // 队列中
  | "IN_PROGRESS"       // 生成中
  | "COMPLETED"         // 生成成功
  | "FAILED"            // 生成失败
  | "SAVED_TO_R2"; // 已保存到云存储

export type ImageGenerationSource = 
  | "web"          // 网页端
  | "api"          // API接口
  | "mobile"       // 移动端
  | "extension";   // 浏览器插件

export type ImageGenerationMode = 
  | "text-to-image"  // 文本生成图片
  | "image-edit"     // 图片编辑
  | "image-to-image" // 图片转换
  | "inpainting"     // 图片修复
  | "outpainting";   // 图片扩展

export interface ImageGeneration {
  id: string;                          // UUID 主键
  user_id: string;                     // 用户ID，关联users表
  task_id?: string | null;             // 通用任务ID
  provider_task_id?: string | null;    // 服务提供商的任务ID
  provider: string;                    // 服务提供商标识 (nano_banana, openai, etc.)
  model_id: string;                    // AI模型ID
  prompt: string;                      // 用户输入提示词
  optimized_prompt?: string | null;    // 优化后的提示词
  negative_prompt?: string | null;     // 负面提示词
  mode: ImageGenerationMode;           // 生成模式
  source: ImageGenerationSource;       // 创建来源
  
  // 输入图片相关 (for image-edit, image-to-image modes)
  input_image_urls?: string[] | null;  // 输入图片URL数组 (JSONB)
  input_image_count?: number | null;   // 输入图片数量
  
  // 生成参数
  aspect_ratio?: string | null;        // 宽高比 "1:1", "16:9", "9:16"
  quality?: string | null;             // 图片质量 "standard", "high", "ultra"
  style?: string | null;               // 风格设置
  seed?: number | null;                // 随机种子
  cfg_scale?: number | null;           // CFG Scale
  steps?: number | null;               // 生成步数
  width?: number | null;               // 图片宽度
  height?: number | null;              // 图片高度
  
  // 状态和结果
  status: ImageGenerationStatus;       // 生成状态
  is_delete: boolean;                  // 是否已删除 (软删除)
  image_urls?: string[] | null;        // 生成的图片URL数组 (JSONB)
  image_urls_r2?: string[] | null;     // R2存储的图片URL数组 (JSONB)
  image_count?: number | null;         // 生成图片数量
  
  // 积分消耗
  credits_used: number;                // 消耗的积分数
  credits_cost?: number | null;        // 预计积分成本
  
  // 错误和日志
  error_message?: string | null;       // 错误信息
  logs?: any | null;                   // 生成日志 (JSONB)
  metrics?: any | null;                // 性能指标 (JSONB)
  
  // 扩展信息
  metadata?: any | null;               // 额外元数据 (JSONB)
  tags?: string[] | null;              // 标签 (JSONB)
  
  // 时间戳
  created_at: string;                  // 创建时间
  updated_at: string;                  // 更新时间
  completed_at?: string | null;        // 完成时间
}

export interface CreateImageGenerationParams {
  user_id: string;
  model_id: string;
  prompt: string;
  optimized_prompt?: string;
  negative_prompt?: string;
  mode: ImageGenerationMode;
  source: ImageGenerationSource;
  task_id?: string;
  provider_task_id?: string;
  provider: string;
  input_image_urls?: string[];
  aspect_ratio?: string;
  quality?: string;
  style?: string;
  seed?: number;
  cfg_scale?: number;
  steps?: number;
  width?: number;
  height?: number;
  credits_used: number;
  credits_cost?: number;
  status?: ImageGenerationStatus;
  is_delete?: boolean;
  metadata?: any;
  tags?: string[];
}

export interface UpdateImageGenerationParams {
  provider_task_id?: string;
  status?: ImageGenerationStatus;
  image_urls?: string[];
  image_urls_r2?: string[];
  image_count?: number;
  is_delete?: boolean;
  error_message?: string;
  logs?: any;
  metrics?: any;
  metadata?: any;
  completed_at?: string;
}

// 图片生成统计
export interface ImageGenerationStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number; // IN_QUEUE + IN_PROGRESS
}

// API请求参数
export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  mode: ImageGenerationMode;
  negative_prompt?: string;
  image_urls?: string[];              // For image-edit mode
  aspect_ratio?: string;
  quality?: string;
  style?: string;
  seed?: number;
  cfg_scale?: number;
  steps?: number;
  width?: number;
  height?: number;
}

// 历史记录显示接口
export interface ImageGenerationHistoryItem {
  id: string;
  prompt: string;
  image_urls?: string[];
  status: ImageGenerationStatus;
  model_id: string;
  mode: ImageGenerationMode;
  source: ImageGenerationSource;
  provider: string;
  credits_used: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

// 提供商专用扩展接口（示例）
export interface ProviderImageGeneration extends ImageGeneration {
  provider_task_id: string;            // 必需的提供商任务ID  
  callback_received_at?: string | null; // 回调接收时间
  callback_data?: any | null;          // 原始回调数据 (JSONB)
}
