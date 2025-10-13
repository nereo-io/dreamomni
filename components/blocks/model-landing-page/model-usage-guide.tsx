"use client";
import React from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";

import type {
  Step as StepType,
  ModelUsageGuideProps,
} from "@/types/pages/model-landing-page";

const Step: React.FC<StepType> = ({ number, title, description }) => {
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-xl p-8 flex flex-col border border-border transition-all duration-300 hover:bg-card/90 hover:-translate-y-1 h-full">
      <div className="text-5xl font-black mb-4 text-primary-foreground bg-clip-text">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default function ModelUsageGuide({ section }: ModelUsageGuideProps) {
  const handleButtonClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="text-foreground py-12 bg-gray-900 usage-guide-section">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-black mb-10 text-center text-foreground">
            {section.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {section.description}
          </p>
        </div>

        {/* 步骤卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
        <div className="flex justify-center">
          <RainbowButton
            onClick={handleButtonClick}
            className="transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={`${section.buttonText} - 点击返回页面顶部`}
          >
            {section.buttonText}
          </RainbowButton>
        </div>
      </div>
    </div>
  );
}
