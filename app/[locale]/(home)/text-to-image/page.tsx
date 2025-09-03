import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getTextToVideoPage } from "@/services/page"; // 暂时使用现有的页面服务
import { getTranslations } from "next-intl/server";
import TextToImageTab from "@/components/blocks/ai-image-generation-tool/TextToImageTab";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/text-to-image`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/text-to-image`;
  }

  return {
    title: t("pages.textToImage.title"),
    description: t("pages.textToImage.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function TextToImagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // 使用文本生成视频的页面数据作为模板，后续可以创建专门的文本生成图片页面数据
  const pageData = await getTextToVideoPage(locale);
  
  // 为文本生成图片定制化数据
  const textToImagePageData = {
    aiModelsHero: {
      ...pageData.aiModelsHero,
      title: "AI Text to Image Generator",
      description: "Transform your words into stunning visuals with cutting-edge AI technology"
    },
    creatorShowcase: {
      ...pageData.creatorShowcase,
      title: "Text to Image Creation Showcase",
      description: "Explore the possibilities of AI-powered text-to-image generation"
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Common questions about AI text-to-image generation",
      items: [
        {
          id: "1",
          question: "How does text-to-image generation work?",
          answer: "Our AI analyzes your text description and creates high-quality images that match your vision using advanced machine learning models."
        },
        {
          id: "2",
          question: "What kind of descriptions work best?",
          answer: "Detailed, specific descriptions work best. Include style, mood, colors, and composition details for optimal results."
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
      title: "Start Creating Images from Text Today",
      buttons: [
        {
          title: "Get Started",
          url: "/text-to-image",
          target: "_self"
        }
      ]
    }
  };

  return (
    <>
      {/* Text to Image Generation Tool */}
      <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
        <TextToImageTab />
      </div>

      {/* AI Models Hero */}
      <AIModelsHero data={textToImagePageData.aiModelsHero} />

      {/* Creator Showcase */}
      <CreatorShowcase data={textToImagePageData.creatorShowcase} />

      {/* FAQ Section */}
      <FAQSection
        title={textToImagePageData.faq.title}
        description={textToImagePageData.faq.description}
        faqItems={textToImagePageData.faq.items}
      />

      {/* CTA Section */}
      <CTA section={textToImagePageData.cta} />
    </>
  );
}
