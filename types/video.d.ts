// ----- TYPE DEFINITIONS -----

export type VideoGenerationStatus =
  | "PENDING"
  | "PROMPT_OPTIMIZING"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "SAVED_TO_R2";

export interface VideoGeneration {
  id: string; // uuid
  user_id: string; // integer, references public.users.id
  fal_request_id?: string | null;
  volcano_request_id?: string | null; // Volcano Engine request ID
  veo3_request_id?: string | null; // Veo3 APICore request ID
  ali_request_id?: string | null; // Ali Video Generation request ID
  model_id: string;
  prompt: string;
  optimized_prompt?: string | null; // 优化后的提示词
  input_image_url?: string | null;
  negative_prompt?: string | null;
  aspect_ratio: string;
  duration_seconds: number;
  cfg_scale?: number | null;
  seed?: number | null;
  has_audio?: boolean | null; // 新增：是否包含音频
  status: VideoGenerationStatus;
  video_url_r2?: string | null;
  video_url_fal?: string | null;
  video_url_volcano?: string | null; // Volcano Engine video URL
  video_url_veo3?: string | null; // Veo3 APICore video URL
  video_url_ali?: string | null; // Ali Video Generation video URL
  upsample_video_url_veo3?: string | null; // Veo3 high-quality video URL
  error_message?: string | null;
  logs?: any | null; // jsonb
  metrics?: any | null; // jsonb
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface CreateVideoGenerationParams {
  user_id: string;
  model_id: string;
  prompt: string;
  optimized_prompt?: string; // 优化后的提示词
  fal_request_id?: string;
  volcano_request_id?: string; // Volcano Engine request ID
  veo3_request_id?: string; // Veo3 APICore request ID
  ali_request_id?: string; // Ali Video Generation request ID
  input_image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration_seconds?: number;
  cfg_scale?: number;
  seed?: number;
  has_audio?: boolean; // 新增：是否包含音频
  status?: VideoGenerationStatus; // 允许在创建时指定初始状态
  effect_id?: string; // 新增：特效ID
}

export interface UpdateVideoGenerationParams {
  status?: VideoGenerationStatus;
  optimized_prompt?: string; // 优化后的提示词
  video_url_r2?: string;
  video_url_fal?: string;
  video_url_volcano?: string; // Volcano Engine video URL
  video_url_veo3?: string; // Veo3 APICore video URL
  video_url_ali?: string; // Ali Video Generation video URL
  upsample_video_url_veo3?: string; // Veo3 high-quality video URL
  error_message?: string;
  logs?: any;
  metrics?: any;
  fal_request_id?: string; // 有时可能在创建后才知道 fal_request_id
  volcano_request_id?: string; // Volcano Engine request ID
  veo3_request_id?: string; // Veo3 APICore request ID
  ali_request_id?: string; // Ali Video Generation request ID
}

// Adding types from previous video.d.ts content if they are still relevant
// from types/video.d.ts (as it was before this operation)

// API 响应类型 (assuming this is still needed and not duplicated)
export interface VideoGenerationHistoryResponse {
  data: VideoGeneration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 视频生成统计类型 (assuming this is still needed)
export interface VideoGenerationStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing?: number; // As per the model file, added processing
}

// 视频生成请求参数类型 (assuming this is still needed for frontend or API layers)
export interface VideoGenerationRequest {
  model: string;
  mode: "text-to-video" | "image-to-video";
  prompt: string;
  duration: string; // Note: model uses duration_seconds (number)
  aspect_ratio: string;
  image?: File; // For client-side uploads
  cfg_scale?: number;
  negative_prompt?: string;
}

// 视频播放器组件Props (UI specific, good to keep here)
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

// 视频卡片组件Props (UI specific, good to keep here)
export interface VideoCardProps {
  video: VideoGeneration; // Uses the main VideoGeneration type
  onPlay?: (video: VideoGeneration) => void;
  onDelete?: (video: VideoGeneration) => void;
  onRegenerate?: (video: VideoGeneration) => void;
  className?: string;
}
