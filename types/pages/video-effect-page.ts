import type { EffectLandingPageProps } from "@/types/blocks/effect-landing-page";
import type { VideoEffectShowcaseItem } from "@/types/blocks/video-effect-tool";

export type EffectLandingPageContent = Omit<
  EffectLandingPageProps,
  "toolComponent"
>;

export interface VideoEffectPage {
  page?: EffectLandingPageContent;
  tool?: {
    showcaseItems: VideoEffectShowcaseItem[];
    form: {
      title: string;
      backgroundImage: string;
    };
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}
