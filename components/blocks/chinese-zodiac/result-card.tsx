"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac-caculator";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";

interface ResultCardProps {
  t: ChineseZodiacPage;
  zodiac: string;
  element: string;
  visible: boolean;
  year: number | null;
}

export const ZodiacResultCard = ({
  t,
  zodiac,
  element,
  visible,
  year,
}: ResultCardProps) => {
  if (!visible || !zodiac || !element) return null;

  const locale = useLocale();
  const [zodiacContent, setZodiacContent] = useState<any>(null);

  useEffect(() => {
    const loadZodiacContent = async () => {
      try {
        const content = await import(
          `@/i18n/content/chinese-zodiac/${locale}.json`
        );
        setZodiacContent(content.default);
      } catch (error) {
        console.error("Failed to load zodiac content:", error);
      }
    };

    loadZodiacContent();
  }, [locale]);

  const getArticleSlug = () => {
    return `${year || "unknown"}-${zodiac}-fortune-forecast-2025`;
  };

  const isValidYear = () => {
    return year !== null && year >= 1944 && year <= 2022;
  };

  const zodiacName = t.zodiacSigns[zodiac as keyof typeof t.zodiacSigns];
  const elementName = t.elements[element as keyof typeof t.elements];

  // 获取元素对应的主题色
  const getElementColor = (el: string) => {
    switch (el) {
      case "wood":
        return {
          header: "bg-emerald-50 dark:bg-emerald-950/30",
          text: "text-emerald-700 dark:text-emerald-400",
          border: "border-emerald-200 dark:border-emerald-800",
          accent: "bg-emerald-600 dark:bg-emerald-500",
          light: "bg-emerald-100 dark:bg-emerald-900/50",
        };
      case "fire":
        return {
          header: "bg-rose-50 dark:bg-rose-950/30",
          text: "text-rose-700 dark:text-rose-400",
          border: "border-rose-200 dark:border-rose-800",
          accent: "bg-rose-600 dark:bg-rose-500",
          light: "bg-rose-100 dark:bg-rose-900/50",
        };
      case "earth":
        return {
          header: "bg-amber-50 dark:bg-amber-950/30",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
          accent: "bg-amber-600 dark:bg-amber-500",
          light: "bg-amber-100 dark:bg-amber-900/50",
        };
      case "metal":
        return {
          header: "bg-slate-50 dark:bg-slate-800/30",
          text: "text-slate-700 dark:text-slate-300",
          border: "border-slate-200 dark:border-slate-700",
          accent: "bg-slate-600 dark:bg-slate-500",
          light: "bg-slate-100 dark:bg-slate-800/50",
        };
      case "water":
        return {
          header: "bg-blue-50 dark:bg-blue-950/30",
          text: "text-blue-700 dark:text-blue-400",
          border: "border-blue-200 dark:border-blue-800",
          accent: "bg-blue-600 dark:bg-blue-500",
          light: "bg-blue-100 dark:bg-blue-900/50",
        };
      default:
        return {
          header: "bg-secondary",
          text: "text-secondary-foreground",
          border: "border-border",
          accent: "bg-primary",
          light: "bg-secondary/50",
        };
    }
  };

  const colors = getElementColor(element);

  return (
    <div
      className={`mt-10 transition-all duration-500 ${
        visible
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform -translate-y-4"
      }`}
    >
      <Card className="border shadow-lg overflow-hidden rounded-xl">
        {/* 头部 */}
        <CardHeader
          className={`border-b px-6 py-5 ${colors.header} ${colors.border}`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className={`text-3xl font-bold ${colors.text}`}>
                {elementName} {zodiacName}
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/80 text-sm md:text-base">
                {t.results.yourZodiac}: {elementName} {zodiacName}
              </CardDescription>
            </div>
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-card border-4 shadow-md transform transition-transform hover:scale-105 duration-300 ease-in-out">
              <div
                className={`absolute inset-0 border-4 rounded-full ${colors.border} z-10`}
              ></div>
              <Image
                src={`/imgs/zodiac/${zodiac}.png`}
                alt={zodiacName}
                fill
                className="object-cover z-0"
              />
            </div>
          </div>
        </CardHeader>

        {/* 内容区 */}
        <CardContent className="pt-6 px-6 space-y-8 bg-card">
          {/* 性格特征部分 */}
          <div className="space-y-3">
            <div className="flex items-center">
              <div
                className={`w-1 h-6 rounded-full mr-3 ${colors.accent}`}
              ></div>
              <h3 className="text-xl font-semibold text-foreground">
                {zodiacName} {t.results.personalityTitle}
              </h3>
            </div>
            <div
              className={`p-4 rounded-lg ${colors.light} ${colors.border} border`}
            >
              <p className="text-foreground/90 leading-relaxed">
                {zodiacContent?.personalities?.[zodiac] || (
                  <>
                    {zodiac === "pig" &&
                      "The Pig represents prosperity and sincerity in Chinese tradition. People born in the Year of the Pig are typically good-natured, honest, and generous. They have kind hearts and enjoy helping others, though their trusting nature may sometimes make them vulnerable to deception."}
                    {zodiac === "rat" &&
                      "鼠在中国传统文化中象征着机智和活力。属鼠的人通常聪明灵活，善于把握机会，具有很强的适应能力和生存技能。他们勤劳节俭，善于积累财富。"}
                    {zodiac === "ox" &&
                      "牛在中国传统文化中象征着勤劳和坚韧。属牛的人通常踏实稳重，做事认真负责，有很强的耐心和毅力。他们忠诚可靠，重视家庭，但有时可能显得固执。"}
                    {zodiac === "tiger" &&
                      "虎在中国传统文化中象征着勇气和力量。属虎的人通常性格刚强，充满自信，有领导才能。他们勇敢无畏，敢于冒险，但有时可能显得过于冲动。"}
                    {zodiac === "rabbit" &&
                      "兔在中国传统文化中象征着温柔和优雅。属兔的人通常性格温和，举止优雅，善于交际。他们聪明敏感，有艺术天赋，但有时可能显得过于谨慎。"}
                    {zodiac === "dragon" &&
                      "龙在中国传统文化中象征着权威和成功。属龙的人通常充满活力，自信心强，有领导才能。他们追求完美，有远大抱负，但有时可能显得过于自我。"}
                    {zodiac === "snake" &&
                      "蛇在中国传统文化中象征着智慧和神秘。属蛇的人通常聪明睿智，思维敏捷，有很强的洞察力。他们优雅沉稳，善于思考，但有时可能显得过于神秘。"}
                    {zodiac === "horse" &&
                      "马在中国传统文化中象征着自由和活力。属马的人通常性格开朗，精力充沛，热爱自由。他们积极乐观，适应能力强，但有时可能显得过于急躁。"}
                    {zodiac === "goat" &&
                      "羊在中国传统文化中象征着温顺和艺术。属羊的人通常性格温和，富有同情心，有艺术天赋。他们善良体贴，重视和谐，但有时可能显得过于依赖他人。"}
                    {zodiac === "monkey" &&
                      "猴在中国传统文化中象征着机智和灵活。属猴的人通常聪明机智，反应敏捷，有很强的适应能力。他们幽默风趣，善于交际，但有时可能显得过于狡猾。"}
                    {zodiac === "rooster" &&
                      "鸡在中国传统文化中象征着勤劳和准时。属鸡的人通常勤奋踏实，做事认真，有很强的时间观念。他们注重细节，追求完美，但有时可能显得过于挑剔。"}
                    {zodiac === "dog" &&
                      "狗在中国传统文化中象征着忠诚和正义。属狗的人通常忠诚可靠，正直诚实，有很强的责任感。他们乐于助人，重视友谊，但有时可能显得过于忧虑。"}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 2025年预测部分 */}
          <div className="space-y-3">
            <div className="flex items-center">
              <div
                className={`w-1 h-6 rounded-full mr-3 ${colors.accent}`}
              ></div>
              <h3 className="text-xl font-semibold text-foreground">
                {t.results.prediction2025} {zodiacName}
              </h3>
            </div>
            <div
              className={`p-4 rounded-lg ${colors.light} ${colors.border} border`}
            >
              <p className="text-foreground/90 leading-relaxed">
                {zodiacContent?.predictions?.[zodiac]?.substring(0, 150)}...
              </p>
            </div>
          </div>
        </CardContent>

        {/* 底部 - 只在有效年份范围内显示 */}
        {isValidYear() && (
          <CardFooter
            className={`border-t p-5 ${colors.header} ${colors.border}`}
          >
            <Button
              asChild
              className={`w-full font-medium text-base py-6 shadow-md hover:shadow-lg transition-all`}
            >
              <Link href={`/chinese-zodiac-caculator/${getArticleSlug()}`}>
                {t.results.readMore}
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
