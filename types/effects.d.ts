// Video Effects Type Definitions

export interface VideoEffect {
  id: string
  titleKey?: string
  title?: string
  image: string
  video?: string
  poster?: string
  isHot?: boolean
  category?: string
}

export interface CategoryEffects {
  [categoryName: string]: VideoEffect[]
}

// Effect Card Component Props
export interface EffectCardProps {
  id: string
  titleKey?: string
  title?: string
  image: string
  video?: string
  poster?: string
  isHot?: boolean
}

// Effect Grid Component Props
export interface EffectGridProps {
  effects: VideoEffect[]
  className?: string
}

// Category Effect Section Component Props
export interface CategoryEffectSectionProps {
  categoryName: string
  effects: VideoEffect[]
  className?: string
}

// Video Effects Page Props
export interface VideoEffectsPageProps {
  initialCategory?: string
}