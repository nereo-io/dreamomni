export interface EffectContent {
  seo?: {
    title?: string;
    description?: string;
  };
  howToUse?: {
    steps: Array<{
      number: number;
      title: string;
      description: string;
    }>;
  };
  technicalSpecs?: {
    effectDetails?: Record<string, string>;
    outputSpecs?: Record<string, string>;
  };
  tips?: Array<{
    title: string;
    description: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  cta?: {
    title?: string;
    buttonText?: string;
  };
}

export interface VideoEffect {
  id: string;
  slug: string;
  locale: string;
  title: string;
  page_title: string;
  page_description: string | null;
  content: EffectContent | null;
  preview_image: string | null;
  preview_video: string | null;
  preview_thumbnail: string | null; // 优化缩略图 (<100KB, 240x180px WebP)
  preview_gif: string | null; // 轻量动图 (<500KB, 320x240px, 2-3s loop)
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
