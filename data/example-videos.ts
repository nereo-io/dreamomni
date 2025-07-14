import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

// 示例视频数据
export const EXAMPLE_VIDEOS = {
  seedance: [
    {
      id: "seedance-demo-2",
      requestId: "seedance-demo-2",
      prompt:
        "A young child walking with a friendly turtle companion in an enchanted forest",
      optimized_prompt: undefined,
      video_url: "https://r2.veo3ai.io/intro/seedance-kids.mp4",
      video_url_r2: undefined,
      video_url_fal: undefined,
      video_url_volcano: undefined,
      video_url_veo3: undefined,
      upsample_video_url_veo3: undefined,
      model_id: "seedance-1-0-pro",
      status: "COMPLETED" as const,
      aspect_ratio: "16:9",
      duration_seconds: 5,
      resolution: "1080p",
      generate_audio: false,
      enable_prompt_enhancement: false,
      image_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: undefined,
    },
  ],
  veo: [
    {
      id: "veo-demo-2",
      requestId: "veo-demo-2",
      prompt:
        "Adorable yellow chick reading a book with glasses in cozy room lighting",
      optimized_prompt: undefined,
      video_url: "https://r2.veo3ai.io/intro/veo-story.mp4",
      video_url_r2: undefined,
      video_url_fal: undefined,
      video_url_volcano: undefined,
      video_url_veo3: undefined,
      upsample_video_url_veo3: undefined,
      model_id: "veo3",
      status: "COMPLETED" as const,
      aspect_ratio: "16:9",
      duration_seconds: 7,
      resolution: "1080p",
      generate_audio: false,
      enable_prompt_enhancement: false,
      image_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: undefined,
    },
  ],
} as const;

export type ExampleVideoType = typeof EXAMPLE_VIDEOS;
