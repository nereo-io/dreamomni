"use client";

import { OverviewSection } from "@/types/blocks/overview";
import { cn } from "@/lib/utils";

interface ZodiacOverviewProps {
  translations: OverviewSection;
  className?: string;
}

export const ZodiacOverview = ({
  translations,
  className = "",
}: ZodiacOverviewProps) => {
  return (
    <section className={cn("w-full py-16 bg-background", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          {translations.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 五行分析 */}
          <div className="bg-secondary/20 dark:bg-secondary/10 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-border">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🌿</span>
              <h3 className="text-xl font-semibold text-foreground">
                {translations.fiveElements.title}
              </h3>
            </div>
            <p className="text-muted-foreground">
              {translations.fiveElements.content}
            </p>
          </div>

          {/* 关键预测 */}
          <div className="bg-primary/10 dark:bg-primary/5 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-border">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🔮</span>
              <h3 className="text-xl font-semibold text-foreground">
                {translations.keyPredictions.title}
              </h3>
            </div>
            <p className="text-muted-foreground">
              {translations.keyPredictions.content}
            </p>
          </div>

          {/* 重要日期 */}
          <div className="bg-accent/20 dark:bg-accent/10 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-border">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">📅</span>
              <h3 className="text-xl font-semibold text-foreground">
                {translations.importantDates.title}
              </h3>
            </div>
            <p className="text-muted-foreground">
              {translations.importantDates.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
