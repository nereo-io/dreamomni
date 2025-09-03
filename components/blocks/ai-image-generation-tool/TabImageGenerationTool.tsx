"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import TextToImageTab from "./TextToImageTab";
import ImageToImageTab from "./ImageToImageTab";

interface TabImageGenerationToolProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

type TabType = "text-to-image" | "image-to-image";

export function TabImageGenerationTool({
  descriptionLabel,
  descriptionPlaceholder,
}: TabImageGenerationToolProps) {
  const [activeTab, setActiveTab] = useState<TabType>("text-to-image");
  const t = useTranslations("imageGenerator");

  const tabs = [
    {
      id: "text-to-image" as TabType,
      name: t("textToImage"),
    },
    {
      id: "image-to-image" as TabType,
      name: t("imageToImage"),
    },
  ];

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10">
      {/* Top Level Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-lg font-medium transition-all duration-200 border-b-2 relative ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <span className="font-semibold">{tab.name}</span>
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="lg:h-[calc(100vh-180px)]">
        {activeTab === "text-to-image" && (
          <TextToImageTab
            descriptionLabel={descriptionLabel}
            descriptionPlaceholder={descriptionPlaceholder}
          />
        )}
        {activeTab === "image-to-image" && (
          <ImageToImageTab
            descriptionLabel={descriptionLabel}
            descriptionPlaceholder={descriptionPlaceholder}
          />
        )}
      </div>
    </div>
  );
}
