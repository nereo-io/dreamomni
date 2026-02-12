import type { EffectLandingPageProps } from "@/types/blocks/effect-landing-page";
import type { EffectShowcaseItem } from "@/types/blocks/image-effect-tool";

export type EffectLandingPageContent = Omit<
  EffectLandingPageProps,
  "toolComponent"
>;

export interface ImageEffectPage {
  page?: EffectLandingPageContent;
  tool?: {
    showcaseItems: EffectShowcaseItem[];
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
