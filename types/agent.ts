/**
 * Agent Types
 * TypeScript definitions for the intelligent video orchestration Agent system
 */

export interface AgentJob {
  id: string;
  user_id: string;
  prompt: string;
  reference_image_url?: string;
  reference_image_urls?: string[];
  duration_seconds: number;
  num_shots: number;
  image_model: string;
  video_model: string;
  aspect_ratio?: string;
  status: 'pending' | 'generating_script' | 'generating_characters' | 'splitting_shots' | 'generating_keyframes' |
          'waiting_for_confirmation' | 'orchestrating_videos' | 'generating_videos' |
          'splicing' | 'completed' | 'failed';
  current_step?: string;
  final_video_url?: string;
  error_message?: string | null;
  credits_charged: number;
  created_at: string;
  updated_at: string;

  // Phase 4: Progress tracking and logs
  progress?: {
    keyframes?: { done: number; total: number; failed?: number };
    videos?: { done: number; total: number; failed?: number };
  };
  logs?: Array<{ timestamp: string; message: string }>;

  // Phase 3.5: Story / characters / quality
  story_outline?: Record<string, any> | null;
  main_characters?: Array<Record<string, any>> | null;
  character_reference_images?: string[] | null;
  shot_quality?: Array<Record<string, any>> | null;
  global_quality?: Record<string, any> | null;

  shots?: AgentShot[];
}

export interface AgentShot {
  id: string;
  job_id: string;
  shot_number: number;
  prompt: string;
  keyframe_prompt?: string;
  keyframe_metadata?: {
    prompt?: string;
    [key: string]: any;
  } | null;
  duration_seconds: number;
  keyframe_url?: string;
  keyframe_status: 'pending' | 'generating' | 'done' | 'failed';
  video_url?: string;
  video_status: 'pending' | 'generating' | 'done' | 'failed';
  created_at: string;
  updated_at?: string;
}

export interface AgentAsset {
  id: string;
  job_id: string;
  asset_type: 'script' | 'image' | 'clip' | 'final' | 'story_outline' | 'character_ref' | 'quality_report';
  url?: string;
  content?: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AgentJobListResponse {
  jobs: AgentJob[];
  total: number;
  page: number;
  page_size: number;
}

export interface AgentAssetListResponse {
  assets: AgentAsset[];
  total: number;
}

export interface CreateAgentJobRequest {
  prompt: string;
  reference_image_url?: string;
  reference_image_urls?: string[];
  duration_seconds: number;
  image_model?: string;
  video_model?: string;
}

export interface CreateAgentJobResponse {
  job_id: string;
  message: string;
}

// Status display helpers
export const AgentJobStatusMap: Record<AgentJob['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  generating_script: { label: 'Scripting', color: 'indigo' },
  generating_characters: { label: 'Casting', color: 'purple' },
  splitting_shots: { label: 'Planning', color: 'blue' },
  generating_keyframes: { label: 'Keyframing', color: 'purple' },
  waiting_for_confirmation: { label: 'Reviewing', color: 'yellow' },
  orchestrating_videos: { label: 'Queueing', color: 'indigo' },
  generating_videos: { label: 'Rendering', color: 'cyan' },
  splicing: { label: 'Splicing', color: 'violet' },
  completed: { label: 'Completed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

export const AgentShotStatusMap: Record<AgentShot['keyframe_status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  generating: { label: 'Generating', color: 'blue' },
  done: { label: 'Done', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};
