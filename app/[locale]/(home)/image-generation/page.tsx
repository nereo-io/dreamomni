import { ImageGenerationTool } from "@/components/blocks/ai-image-generation-tool";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getTextToVideoPage } from "@/services/page"; // 暂时使用现有的页面服务
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/image-generation`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/image-generation`;
  }

  return {
    title: t("pages.imageGeneration.title"),
    description: t("pages.imageGeneration.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageGenerationPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // 使用文本生成视频的页面数据作为模板，后续可以创建专门的图片生成页面数据
  const pageData = await getTextToVideoPage(locale);
  
  // 为图片生成定制化数据
  const imagePageData = {
    aiModelsHero: {
      ...pageData.aiModelsHero,
      title: "AI Image Generation Models",
      description: "Create stunning images with cutting-edge AI technology"
    },
    creatorShowcase: {
      ...pageData.creatorShowcase,
      title: "Image Creation Showcase",
      description: "Explore the possibilities of AI-powered image generation"
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Common questions about AI image generation",
      items: [
        {
          id: "1",
          question: "What image formats are supported?",
          answer: "Our AI generates high-quality images in JPG and PNG formats, optimized for various use cases."
        },
        {
          id: "2",
          question: "How long does it take to generate an image?",
          answer: "Most images are generated within 30-60 seconds, depending on the complexity and model selected."
        },
        {
          id: "3",
          question: "Can I use the generated images commercially?",
          answer: "Yes, all generated images can be used for commercial purposes according to our terms of service."
        }
      ]
    },
    cta: {
      name: "cta",
      title: "Start Creating Images Today",
      buttons: [
        {
          title: "Get Started",
          url: "/image-generation",
          target: "_self"
        }
      ]
    }
  };

  return (
    <>
      {/* Image Generation Tool */}
      <ImageGenerationTool />

      {/* AI Models Hero */}
      <AIModelsHero data={imagePageData.aiModelsHero} />

      {/* Creator Showcase */}
      <CreatorShowcase data={imagePageData.creatorShowcase} />

      {/* FAQ Section */}
      <FAQSection
        title={imagePageData.faq.title}
        description={imagePageData.faq.description}
        faqItems={imagePageData.faq.items}
      />

      {/* CTA Section */}
      <CTA section={imagePageData.cta} />
    </>
  );
}