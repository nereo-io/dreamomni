import React, { useState } from "react";
import { getQuestionList } from "@/models/question";
import { QuestionList as QuestionListType } from "@/types/blocks/question";
import { QuestionCard } from "@/components/blocks/question-card";

export default async function QuestionListBlock({
  category,
  locale,
}: {
  category: string;
  locale: string;
}) {
  const questions: QuestionListType = await getQuestionList({
    category,
    locale,
  });

  return (
    <div className="container mx-auto px-4">
      {questions.items.map((question) => (
        <QuestionCard key={question.slug} question={question} />
      ))}
    </div>
  );
}
