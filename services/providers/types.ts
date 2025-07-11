// Video generation provider interface types

export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  image_url?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  duration?: string;
  cfg_scale?: number;
  seed?: number;
  generate_audio?: boolean;
  enable_prompt_enhancement?: boolean;
  [key: string]: any;
}

export interface VideoGenerationResponse {
  request_id: string;
  status: string;
  model: string;
  [key: string]: any;
}

export interface VideoGenerationStatus {
  request_id: string;
  status: string;
  logs?: any[];
  metrics?: any;
  error?: string;
  progress?: number;
  queue_position?: number;
  [key: string]: any;
}

export interface VideoGenerationResult {
  request_id: string;
  status: string;
  video_url?: string;
  hd_video_url?: string; // 1080P high-definition video URL
  hd_processing?: boolean; // Whether 1080P version is still processing
  hd_available?: boolean; // Whether 1080P version is available
  data?: any;
  [key: string]: any;
}

export interface VideoProvider {
  // Submit a video generation request
  submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse>;

  // Check the status of a video generation request
  status(model: string, requestId: string): Promise<VideoGenerationStatus>;

  // Get the result of a completed video generation request
  result(model: string, requestId: string): Promise<VideoGenerationResult>;

  // Get provider name
  getName(): string;
}
