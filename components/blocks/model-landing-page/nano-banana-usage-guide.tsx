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
  // 背景已改为纯色，移除视差滚动效果代码

  return (
    <div className="min-h-screen bg-purple-950 text-white py-20 usage-guide-section">
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
