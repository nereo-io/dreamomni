import React from "react";
import { getQuestionList, getQuestionCount } from "@/models/question";
import { QuestionListClient } from "./question-list-client";
import QuestionListHeader from "@/components/blocks/question-list-header";
import { QuestionList } from "@/types/blocks/question";

interface QuestionListBlockProps {
  category: string;
  locale: string;
  questionListHeader: any;
  page?: number;
  zodiacFilter?: string;
}

export default async function QuestionListBlock({
  category,
  locale,
  questionListHeader,
  page = 1,
  zodiacFilter,
}: QuestionListBlockProps) {
  // 获取问题列表，添加分页和过滤参数
  const questions: QuestionList = await getQuestionList({
    category,
    locale,
    page,
    limit: 9, // 每页显示9个问题
    tag: zodiacFilter, // 使用tag参数进行生肖过滤
  });

  // 获取总数据量
  const count = await getQuestionCount({
    category,
    locale,
    tag: zodiacFilter,
  });

  const totalPages = Math.ceil((count || 0) / 9);

  return (
    <div id={questionListHeader.name} className="container mx-auto py-12 px-4">
      {questionListHeader && (
        <div className="mb-8">
          <QuestionListHeader questionListHeader={questionListHeader} />
        </div>
      )}

      <QuestionListClient
        questions={questions.items}
        currentPage={page}
        totalPages={totalPages}
        selectedZodiac={zodiacFilter || null}
        category={category}
        locale={locale}
      />
    </div>
  );
}
