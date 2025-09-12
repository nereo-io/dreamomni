"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import VideoTab from "./VideoTab";
import ImageTab from "./ImageTab";

type TabType = "video" | "image";

export default function MyCreationsPage() {
  const t = useTranslations("myCreations");
  const [activeTab, setActiveTab] = useState<TabType>("video");

  const tabs = [
    {
      id: "video" as TabType,
      name: t("videoTab"),
    },
    {
      id: "image" as TabType,
      name: t("imageTab"),
    },
  ];

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10">
      {/* Top Level Tabs */}
      <div className="bg-gray-900 border-b border-gray-700 rounded-t-xl">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-lg font-medium transition-all duration-200 border-b-2 relative ${
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
        {activeTab === "video" && <VideoTab />}
        {activeTab === "image" && <ImageTab />}
      </div>
    </div>
  );
}
