import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { SolveAllQuestionsSection } from "@/types/blocks/slove-all-questions";
import Link from "next/link";
import { getQuestionList } from "@/models/question";
import { QuestionList, QuestionItem } from "@/types/blocks/question";
import { NavCategory } from "@/components/blocks/nav-category";
import {
  CategoryEnum,
  CategoryIcons,
  getCategoryMetadata,
} from "@/types/category-enum";

export const SolveAllQuestions = async ({
  section,
}: {
  section: SolveAllQuestionsSection;
}) => {
  const questionCards: QuestionList = await getQuestionList({
    locale: "en",
  });
  // console.log(questionCards);
  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4">
      {/* 标题部分 */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          {section.title}
        </h2>
        <p className="text-muted-foreground">{section.description}</p>
      </div>
      <NavCategory />

      {/* 问题卡片部分 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionCards.items.map((card: QuestionItem, index: number) => {
          // 获取对应的图标组件（如果存在的话）
          const categoryKey = card.category as unknown as CategoryEnum;
          const IconComponent = CategoryIcons[categoryKey];

          return (
            <Link
              href={`/resources/${card.category}/questions/${card.slug}`}
              key={index}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300">
                      {IconComponent ? (
                        <IconComponent className="h-5 w-5" />
                      ) : null}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {card.category}
                    </span>
                  </div>
                  <p className="text-sm mb-2 dark:text-gray-200">
                    {card.title}
                  </p>
                  {card.tags && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.tags.join(" ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SolveAllQuestions;
