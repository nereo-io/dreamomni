import React from "react";
import { getQuestionList } from "@/models/question";
import { QuestionList as QuestionListType } from "@/types/blocks/question";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionListHeader as QuestionListHeaderType } from "@/types/blocks/base";
import QuestionListHeader from "@/components/blocks/question-list-header";

export default async function QuestionListBlock({
  category,
  locale,
  questionListHeader,
}: {
  category: string;
  locale: string;
  questionListHeader: QuestionListHeaderType;
}) {
  const questions: QuestionListType = await getQuestionList({
    category,
    locale,
  });

  return (
    <div className="container mx-auto py-6 px-4">
      {questionListHeader && questions.items.length > 0 && (
        <QuestionListHeader questionListHeader={questionListHeader} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.items.length > 0 &&
          questions.items.map((question) => (
            <Link
              href={`/reading/${category}/questions/${question.slug}`}
              key={question.slug}
              className="block h-full"
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="text-base font-semibold mb-3 line-clamp-2">
                    {question.title}
                  </h3>
                  {question.tags && question.tags.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {question.tags[0]}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
