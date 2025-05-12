"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Section as SectionType } from "@/types/blocks/section";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

export default function CTAIching({ section }: { section: SectionType[] }) {
  if (section[0].disabled) {
    return null;
  }

  const { title, description, buttons } = section[0];
  const secondSlide = section[1];

  // 自动轮播逻辑
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    // 设置自动轮播间隔
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    // 监听滚动事件以更新当前轮播项
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    return () => {
      clearInterval(interval);
      api.off("select");
    };
  }, [api]);

  return (
    <section id={section[0].name} className="py-6">
      <div className="container px-4 md:px-6 flex justify-center">
        <Carousel
          setApi={setApi}
          className="w-full max-w-3xl relative"
          opts={{
            loop: true,
            align: "start",
          }}
        >
          <CarouselContent>
            {/* 第二个轮播项 - 符咒主题 (CSS生成的背景) */}
            <CarouselItem className="min-w-0">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative h-[110px] bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {/* CSS生成的太极背景 */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* 左侧装饰 */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-10">
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-500 dark:to-slate-600 relative">
                      <div
                        className="absolute top-0 left-1/2 w-16 h-32 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-r-full"
                        style={{ transform: "translateX(-50%)" }}
                      ></div>
                      <div className="absolute top-6 left-6 w-4 h-4 rounded-full bg-slate-700 dark:bg-slate-500"></div>
                      <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700"></div>
                    </div>
                  </div>

                  {/* 右侧装饰 */}
                  <div className="absolute right-0 top-0 w-24 h-24 opacity-10">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-red-800"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M 50,5 A 45,45 0 0,1 95,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                      />
                      <path
                        d="M 50,95 A 45,45 0 0,1 5,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                      />
                    </svg>
                  </div>

                  {/* 印章装饰 */}
                  <div className="absolute right-8 bottom-8 w-12 h-12 rounded-md bg-red-800/10 rotate-12 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-sm border-2 border-red-800/20 flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-800/20"></div>
                    </div>
                  </div>
                </div>

                {/* 内容层 */}
                <div className="absolute inset-0 flex items-center justify-between p-5 md:p-6">
                  <div className="max-w-[250px] md:max-w-[300px] lg:max-w-[450px]">
                    <h2 className="text-xl md:text-2xl font-bold text-[#9C2C12] dark:text-[#FF6347]">
                      {secondSlide.title}
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mt-2">
                      {secondSlide.description}
                    </p>
                  </div>

                  <Button
                    asChild
                    variant="secondary"
                    className="bg-[#9C2C12] hover:bg-[#7A2109] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 px-5 h-auto rounded-lg border-none hover:scale-105 whitespace-nowrap"
                  >
                    <a
                      href={secondSlide.buttons?.[0]?.url || ""}
                      className="flex items-center py-2"
                    >
                      {secondSlide.buttons?.[0]?.title || ""}
                    </a>
                  </Button>
                </div>
              </div>
            </CarouselItem>

            {/* 第一个轮播项 - 原始的I Ching设计 */}
            <CarouselItem className="min-w-0">
              <div className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 w-full overflow-hidden shadow-lg border border-purple-400/20 relative h-[110px]">
                {/* 装饰性I Ching符号 - 左侧 */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-10">
                  <div className="flex flex-col gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={`left-${i}`} className="w-16 h-2">
                        <div
                          className={`h-full bg-yellow-200 ${
                            i % 3 === 0 ? "w-full" : "w-1/2 ml-2"
                          } rounded-full`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="flex flex-row justify-between items-center p-5 md:p-6 h-full">
                  <div className="flex flex-col max-w-[250px] md:max-w-[300px] lg:max-w-[450px]">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                      <Sparkles className="h-5 w-5 text-yellow-300 mr-2 flex-shrink-0" />
                      <span>{title}</span>
                    </h2>
                  </div>

                  <div className="flex-shrink-0">
                    {buttons &&
                      buttons.map((button, index) => (
                        <Button
                          key={index}
                          asChild
                          variant="secondary"
                          className="bg-white hover:bg-purple-50 text-purple-900 font-medium shadow-md hover:shadow-lg transition-all duration-300 px-5 h-auto rounded-lg border border-purple-100 hover:scale-105 whitespace-nowrap"
                        >
                          <a
                            href={button.url || ""}
                            target={button.target}
                            className="flex items-center py-2"
                          >
                            {button.title}
                          </a>
                        </Button>
                      ))}
                  </div>
                </div>

                {/* 易经八卦底纹装饰 */}
                <div className="w-full h-2 bg-purple-900/40 relative overflow-hidden">
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="flex items-center space-x-6 opacity-50">
                      {/* 阴阳符号 */}
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-200 to-purple-300 relative">
                        <div className="absolute top-0 left-1/2 w-1.5 h-3 bg-purple-900 rounded-l-full"></div>
                        <div className="absolute top-1/4 right-1/4 w-1 h-1 rounded-full bg-yellow-200"></div>
                        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-purple-900"></div>
                      </div>

                      {/* 八卦线条装饰 */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-0.5">
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full ml-0.5"></div>
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                      </div>

                      {/* 中间装饰线 */}
                      <div className="w-16 h-px bg-yellow-200/70"></div>

                      {/* 更多八卦线条 */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-0.5">
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-1.5 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                          <div className="w-3 h-0.5 bg-yellow-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>

          {/* 轮播指示器 - 底部居中 */}
          <div className="absolute bottom-2 left-0 w-full flex justify-center z-10">
            <div className="flex items-center space-x-1.5">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    current === idx ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
