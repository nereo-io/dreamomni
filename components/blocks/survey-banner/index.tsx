"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function SurveyBanner() {
  const { surveyBannerVisible, setSurveyBannerVisible } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const t = useTranslations("survey_banner");

  useEffect(() => {
    setIsClient(true);
    // 检查本地存储中是否已经点击过
    const hasClicked = localStorage.getItem("surveyBannerClicked");
    if (hasClicked === "true") {
      setSurveyBannerVisible(false);
    }
  }, [setSurveyBannerVisible]);

  const handleClick = () => {
    // 记录用户已点击
    localStorage.setItem("surveyBannerClicked", "true");
    setSurveyBannerVisible(false);

    // 跳转到调研页面
    window.open("https://form.jotform.com/250842780513153", "_blank");
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 记录用户已关闭
    localStorage.setItem("surveyBannerClicked", "true");
    setSurveyBannerVisible(false);
  };

  // 在服务器端渲染时不显示，避免水合不匹配
  if (!isClient) return null;
  if (!surveyBannerVisible) return null;

  return (
    <div
      className="bg-orange-500 text-white py-2 cursor-pointer relative hover:bg-orange-600 transition-all"
      onClick={handleClick}
    >
      <div className="md:max-w-7xl mx-auto px-4 text-center font-medium">
        {t("message")}
      </div>
      <button
        onClick={handleClose}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100 transition-all p-1 rounded-full hover:bg-white/20"
        aria-label={t("close")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
