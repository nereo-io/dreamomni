import React from "react";
import { getQuestionList } from "@/models/question";
import { QuestionList as QuestionListType } from "@/types/blocks/question";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            <Card key={question.slug} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={question.author_avatar_url || ""}
                      alt={question.author_name || "匿名"}
                    />
                    <AvatarFallback>
                      {(question.author_name || "匿名").substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    {question.author_name || "匿名"}
                  </span>
                </div>
                <CardTitle className="text-base line-clamp-3">
                  {question.title}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      rating: {question.rating || 0} ({question.votes || 0}{" "}
                      votes)
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="prose max-w-none dark:prose-invert line-clamp-4 text-sm">
                  {question.content.substring(0, 200)}...
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-start gap-2">
                {/* 分类: {question.category}{" "} */}
                <div className="flex flex-wrap gap-2 line-clamp-1">
                  {question.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* <div className="text-xs text-gray-500 mt-2">
                    Slug: {question.slug}
                  </div> */}
                {/* <div className="text-xs text-gray-500">
                    创建时间:{" "}
                    {new Date(question.created_at || "").toLocaleString()}
                  </div> */}
                <Button asChild className="mt-4 w-full" size="sm">
                  <Link
                    href={`/reading/${category}/questions/${question.slug}`}
                  >
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
}
