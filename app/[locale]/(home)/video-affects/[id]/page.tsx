"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Play, Upload } from "lucide-react";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { HowToUseSection } from "@/components/blocks/how-to-use-section";

interface EffectDetailPageProps {
  params: {
    id: string;
  };
}

export default function EffectDetailPage({ params }: EffectDetailPageProps) {
  const t = useTranslations("pages.effectDetail");
  const tHowTo = useTranslations("components.howToUseSection");

  // 根据ID获取特效信息
  const getEffectInfo = (id: string) => {
    const effectsMap: Record<string, any> = {
      "ai-kissing": {
        title: t("effectsMap.ai-kissing.title"),
        description: t("effectsMap.ai-kissing.description"),
        image:
          "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop",
      },
      "ai-muscle": {
        title: t("effectsMap.ai-muscle.title"),
        description: t("effectsMap.ai-muscle.description"),
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
      },
      // 默认效果
      default: {
        title: t("defaultTitle"),
        description: t("defaultDescription"),
        image:
          "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=600&fit=crop",
      },
    };

    return effectsMap[id] || effectsMap.default;
  };

  const effectInfo = getEffectInfo(params.id);

  return (
    <>
      {/* Effect Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {effectInfo.title}
            </h1>
            <p className="text-gray-200 mb-6">{effectInfo.description}</p>
            <Button className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 rounded-full">
              {t("tryButtonText")}
            </Button>
          </div>
          <div className="flex justify-center">
            <img
              src={effectInfo.image}
              alt={effectInfo.title}
              className="w-full max-w-md h-64 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="image-to-video"
        descriptionLabel={t("effectDescriptionLabel")}
        descriptionPlaceholder={t("effectDescriptionPlaceholder")}
      />

      <HowToUseSection
        title={t("howToUse.title")}
        steps={[
          {
            icon: <Upload className="h-8 w-8 text-white" />,
            title: tHowTo("uploadImage.title"),
            description: tHowTo("uploadImage.description"),
          },
          {
            icon: <span className="text-white font-bold text-xl">AI</span>,
            title: tHowTo("aiProcessing.title"),
            description: tHowTo("aiProcessing.description"),
          },
          {
            icon: <Play className="h-8 w-8 text-white" />,
            title: tHowTo("downloadVideo.title"),
            description: tHowTo("downloadVideo.description"),
          },
        ]}
      />
    </>
  );
}
