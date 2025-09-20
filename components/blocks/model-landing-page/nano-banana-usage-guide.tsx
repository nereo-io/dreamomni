"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Step {
  number: string;
  title: string;
  description: string;
}

interface UsageGuideSection {
  title: string;
  description: string;
  steps: Step[];
  buttonText: string;
}

interface NanoBananaUsageGuideProps {
  section: UsageGuideSection;
}

const Step: React.FC<Step> = ({ number, title, description }) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-8 flex flex-col border border-gray-700/50 transition-all duration-300 hover:bg-gray-800/90 hover:border-purple-500/30 hover:-translate-y-1 h-full">
      <div className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
};

export default function NanoBananaUsageGuide({
  section,
}: NanoBananaUsageGuideProps) {
  // 添加视差滚动效果
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const guideSection = document.querySelector(
        ".usage-guide-section"
      ) as HTMLElement | null;
      if (guideSection) {
        guideSection.style.backgroundPositionY = `${scrollY * 0.2}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950/90 via-purple-900/70 to-indigo-950/80 text-white py-20 usage-guide-section bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] bg-repeat opacity-95">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            {section.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {section.description}
          </p>
        </div>

        {/* 步骤卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {section.steps.map((step, index) => (
            <div
              key={index}
              className="animate-fade-in-up h-full"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Step
                number={step.number}
                title={step.title}
                description={step.description}
              />
            </div>
          ))}
        </div>

        {/* 按钮区域 */}
        <div className="text-center">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-6 px-16 rounded-full text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1"
            asChild
          >
            <Link href="https://pollo.ai">{section.buttonText}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
