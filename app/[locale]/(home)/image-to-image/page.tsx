import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getTextToVideoPage } from "@/services/page"; // 暂时使用现有的页面服务
import { getTranslations } from "next-intl/server";
import ImageToImageTab from "@/components/blocks/ai-image-generation-tool/ImageToImageTab";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/image-to-image`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/image-to-image`;
  }

  return {
    title: t("pages.imageToImage.title"),
    description: t("pages.imageToImage.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageToImagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // 使用文本生成视频的页面数据作为模板，后续可以创建专门的图片编辑页面数据
  const pageData = await getTextToVideoPage(locale);
  
  // 为图片编辑定制化数据
  const imageToImagePageData = {
    aiModelsHero: {
      ...pageData.aiModelsHero,
      title: "AI Image to Image Editor",
      description: "Transform and edit your images with powerful AI technology"
    },
    creatorShowcase: {
      ...pageData.creatorShowcase,
      title: "Image to Image Transformation Showcase",
      description: "Explore the possibilities of AI-powered image editing and transformation"
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Common questions about AI image-to-image editing",
      items: [
        {
          id: "1",
          question: "What types of image edits can I make?",
          answer: "You can change styles, add elements, modify backgrounds, adjust lighting, and transform your images in countless creative ways."
        },
        {
          id: "2",
          question: "What image formats are supported?",
          answer: "We support JPEG, PNG, and WEBP formats up to 10MB in size for optimal processing."
        },
        {
          id: "3",
          question: "How do I get the best results?",
          answer: "Use clear, high-quality source images and provide detailed descriptions of the changes you want to make."
        }
      ]
    },
    cta: {
      name: "cta",
      title: "Start Transforming Your Images Today",
      buttons: [
        {
          title: "Get Started",
          url: "/image-to-image",
          target: "_self"
        }
      ]
    }
  };

  return (
    <>
      {/* Image to Image Editing Tool */}
      <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
        <ImageToImageTab />
      </div>

      {/* AI Models Hero */}
      <AIModelsHero data={imageToImagePageData.aiModelsHero} />

      {/* Creator Showcase */}
      <CreatorShowcase data={imageToImagePageData.creatorShowcase} />

      {/* FAQ Section */}
      <FAQSection
        title={imageToImagePageData.faq.title}
        description={imageToImagePageData.faq.description}
        faqItems={imageToImagePageData.faq.items}
      />

      {/* CTA Section */}
      <CTA section={imageToImagePageData.cta} />
    </>
  );
}
