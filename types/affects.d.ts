// Video Effects Type Definitions

export interface VideoAffect {
  id: string;
  slug: string;
  locale: string;
  title: string;
  description?: string | null;
  preview_image: string;
  preview_video?: string | null;
  credits_required: number;
  is_hot?: boolean;
  category?: string | null;
  display_order: number;
  status: "created" | "online" | "offline" | "deleted";
}

export interface CategoryEffects {
  [categoryName: string]: VideoAffect[];
}

// Affect Card Component Props
export interface AffectCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  preview_image: string;
  preview_video?: string | null;
  credits_required: number;
  is_hot?: boolean;
  onClick?: () => void;
}

// Affect Grid Component Props
export interface AffectGridProps {
  effects: VideoAffect[];
  className?: string;
}

// Category Affect Section Component Props
export interface CategoryAffectSectionProps {
  categoryName: string;
  effects: VideoAffect[];
  className?: string;
}

// Video Effects Page Props
export interface VideoEffectsPageProps {
  initialCategory?: string;
}

// Affect Generator Props
export interface AffectGeneratorProps {
  affectId: string;
  slug: string;
  title: string;
  description?: string | null;
  creditsRequired: number;
  promptTemplate?: string | null;
  parameters?: any | null;
}
