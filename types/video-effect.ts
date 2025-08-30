export interface VideoEffect {
  id: string;
  slug: string;
  locale: string;
  title: string;
  description: string | null;
  content: any | null;
  preview_image: string | null;
  preview_video: string | null;
  parameters: any | null;
  prompt_template: string | null;
  credits_required: number;
  status: 'created' | 'online' | 'offline' | 'deleted';
  is_hot: boolean;
  category: string | null;
  display_order: number;
  effect_type: 'hailuo_prompt' | 'pixverse_template';
  pixverse_template_id: number | null;
  max_images: number;
  created_at: string;
  updated_at: string;
}

export enum VideoEffectStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}