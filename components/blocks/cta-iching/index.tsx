import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Section as SectionType } from "@/types/blocks/section";

export default function CTAIching({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const { title, description, buttons } = section;
  return (
    <section id={section.name} className="py-6">
      <div className="container px-4 md:px-6 flex justify-center">
        <div className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 w-full max-w-3xl overflow-hidden shadow-lg border border-purple-400/20 relative">
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
          <div className="flex flex-row justify-between items-center p-5 md:p-6 min-h-[100px]">
            <div className="flex flex-col max-w-[250px] md:max-w-[300px]">
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
      </div>
    </section>
  );
}
