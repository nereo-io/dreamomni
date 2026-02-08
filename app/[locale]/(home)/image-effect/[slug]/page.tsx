import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import EffectLandingPage from "@/components/blocks/effect-landing-page";
import ImageEffectTool from "@/components/blocks/image-effect-tool";
import type { EffectLandingPageProps } from "@/types/blocks/effect-landing-page";
import type { EffectToolConfig } from "@/types/blocks/image-effect-tool";

// Temporary preview data — will be replaced by DB-driven content
const PREVIEW_EFFECTS: Record<string, EffectLandingPageProps> = {
  "ghibli-style": {
    hero: {
      title: "AI Ghibli Style Photo Effect",
      subtitle:
        "Transform your photos into stunning Studio Ghibli-inspired artwork. Our AI captures the warm colors, soft lighting, and dreamy atmosphere that define the iconic Ghibli aesthetic.",
      ctaText: "Try Ghibli Style Free",
      showcaseMedia: [
        {
          type: "video",
          src: "https://r2.veo3ai.io/intro/veo3.1/sloth_on_train.mp4",
          alt: "Ghibli style photo transformation example",
        },
      ],
    },
    features: [
      {
        id: "authentic-style",
        title: "Authentic Ghibli Aesthetic",
        description:
          "Our AI has been trained to replicate the distinctive visual style of Studio Ghibli films — soft watercolor textures, warm color palettes, and the magical atmosphere that makes every scene feel like a painting.",
        ctaText: "Try It Now",
        media: {
          type: "image",
          src: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          alt: "Authentic Ghibli aesthetic transformation",
        },
      },
      {
        id: "any-photo",
        title: "Works with Any Photo",
        description:
          "Upload portraits, landscapes, pets, or everyday scenes — our AI adapts the Ghibli style to any subject while preserving the original composition and key details of your photo.",
        ctaText: "Upload Your Photo",
        media: {
          type: "image",
          src: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          alt: "Various photos transformed to Ghibli style",
        },
      },
      {
        id: "high-quality",
        title: "High-Resolution Output",
        description:
          "Get crisp, detailed results suitable for printing or sharing on social media. Our AI generates high-resolution images that maintain quality at any size.",
        ctaText: "Generate Now",
        media: {
          type: "image",
          src: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          alt: "High resolution Ghibli style output",
        },
      },
    ],
    howToUse: {
      title: "How to Create Ghibli Style Photos?",
      steps: [
        {
          title: "1. Upload Your Photo",
          description:
            "Select any photo from your device — portraits, landscapes, or group shots all work great.",
        },
        {
          title: "2. Apply Ghibli Effect",
          description:
            "Click generate and our AI will transform your photo into a beautiful Ghibli-inspired artwork.",
        },
        {
          title: "3. Download & Share",
          description:
            "Download your Ghibli-style image in high resolution, ready to share on social media or print.",
        },
      ],
      ctaText: "Start Creating",
    },
    relatedEffects: {
      title: "Explore More Photo Effects",
      effects: [
        {
          id: "anime-style",
          title: "Anime Style",
          slug: "anime-style",
          image: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          href: "/image-effect/anime-style",
        },
        {
          id: "watercolor",
          title: "Watercolor",
          slug: "watercolor",
          image: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          href: "/image-effect/watercolor",
        },
        {
          id: "oil-painting",
          title: "Oil Painting",
          slug: "oil-painting",
          image: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          href: "/image-effect/oil-painting",
        },
        {
          id: "pixel-art",
          title: "Pixel Art",
          slug: "pixel-art",
          image: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
          href: "/image-effect/pixel-art",
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Common questions about the Ghibli Style photo effect.",
      items: [
        {
          question: "What is the Ghibli Style photo effect?",
          answer:
            "The Ghibli Style effect uses AI to transform your photos into artwork inspired by Studio Ghibli films. It applies the characteristic warm colors, soft lighting, and painterly textures that define the iconic Ghibli visual style.",
        },
        {
          question: "What types of photos work best?",
          answer:
            "The effect works well with most photo types including portraits, landscapes, pets, and everyday scenes. Photos with good lighting and clear subjects tend to produce the best results.",
        },
        {
          question: "How many credits does it cost?",
          answer:
            "Each Ghibli Style transformation costs 2 credits. New users receive free credits to try the effect.",
        },
        {
          question: "Can I use the generated images commercially?",
          answer:
            "Yes, images generated with our AI tools can be used for personal and commercial purposes. However, please note that the Ghibli aesthetic is inspired by but not affiliated with Studio Ghibli.",
        },
      ],
    },
  },
};

// Tool configurations for each effect
const EFFECT_TOOL_CONFIGS: Record<string, EffectToolConfig> = {
  "ghibli-style": {
    effectId: "ghibli-style",
    effectSlug: "ghibli-style",
    type: "image",
    showcaseItems: [
      {
        id: "ghibli-1",
        title: "Forest Spirit",
        imageUrl: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
      },
      {
        id: "ghibli-2",
        title: "Countryside Scene",
        imageUrl: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
      },
      {
        id: "ghibli-3",
        title: "Portrait Transform",
        imageUrl: "https://r2.veo3ai.io/intro/nano-pro/Forest-Spirit.png",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const slug = params.slug;
  const effect = PREVIEW_EFFECTS[slug];

  if (!effect) {
    return {
      title: "Effect Not Found | Veo3 AI",
      description: "The requested photo effect could not be found.",
      robots: "noindex,nofollow",
    };
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${
    params.locale !== "en" ? `/${params.locale}` : ""
  }/image-effect/${slug}`;

  return {
    title: `${effect.hero.title} | Veo3 AI`,
    description: effect.hero.subtitle,
    openGraph: {
      title: effect.hero.title,
      description: effect.hero.subtitle,
      url: canonicalUrl,
      type: "article",
      siteName: "Veo3 AI",
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: "index,follow",
  };
}

export default async function ImageEffectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const effectData = PREVIEW_EFFECTS[slug];

  if (!effectData) {
    notFound();
  }

  const toolConfig = EFFECT_TOOL_CONFIGS[slug];
  const toolComponent = toolConfig ? (
    <ImageEffectTool config={toolConfig} />
  ) : undefined;

  return (
    <div className="min-h-screen">
      <EffectLandingPage {...effectData} toolComponent={toolComponent} />
    </div>
  );
}
