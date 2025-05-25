export interface VideoDemo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  description?: string;
}

export interface ControlParameter {
  id: string;
  label: string;
  type: "slider" | "toggle" | "select" | "input";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue: string | number | boolean;
  description?: string;
}

export interface TechnicalMetric {
  label: string;
  value: string;
  unit?: string;
  description?: string;
  highlight?: boolean;
}

export interface VideoFeature {
  id: string;
  title: string;
  navLabel: string;
  icon: string;
  description: string;
  demoVideos: VideoDemo[];
  controlParameters: ControlParameter[];
  technicalMetrics: TechnicalMetric[];
  highlights: string[];
}

export interface VideoFeatureShowcase {
  title: string;
  description: string;
  badge?: string;
  features: VideoFeature[];
  ctaText: string;
  ctaSubtext?: string;
}
