"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThumbsUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Crumb from "@/components/blocks/crumb";
import ReactMarkdown from "react-markdown";
import type { QuestionDetail, RelatedQuestion } from "@/types/blocks/question";

// 问题详情组件
const QuestionDetail = ({
  title,
  imageSrc,
}: {
  title: string;
  imageSrc?: string;
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold mb-5">问题</h1>
      <div className="bg-gray-50 p-5 rounded-lg mb-5">
        {imageSrc && (
          <Image
            src={imageSrc}
            alt="八字命盘图"
            width={600}
            height={300}
            className="w-full object-contain mb-4"
          />
        )}
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            查看完整命盘
          </Button>
          <span className="text-sm text-gray-500">提问自 中国大陆</span>
        </div>
      </div>
    </div>
  );
};

// 解答组件
const BaziSolution = ({
  content,
  rating = 100,
  votes = 5,
}: {
  content: string;
  rating?: number;
  votes?: number;
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">八字解析</h2>
        <div className="flex items-center">
          <ThumbsUp className="h-4 w-4 mr-1 text-blue-600" />
          <span className="text-blue-600 font-medium">{rating}%</span>
          <span className="text-gray-500 text-sm ml-1">({votes} 评分)</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="markdown">
            <ReactMarkdown
              components={{
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold mb-4">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-md font-bold mb-2">{children}</h4>
                ),
                p: ({ children }) => <p className="mb-4">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 ml-4">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 相关问题组件
const RelatedQuestions = ({
  category,
  questions,
}: {
  category: string;
  questions: RelatedQuestion[] | undefined;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>相关问题</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions?.map((question, index) => (
            <div key={index} className="pb-3 last:pb-0">
              <Link
                href={`/resources/${category}/questions/${question.slug}`}
                className="text-sm hover:text-blue-600"
              >
                {question.title}
              </Link>
              <div className="flex items-center mt-1">
                <ThumbsUp className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-blue-600 text-xs font-medium">
                  {question.rating}%
                </span>
                <span className="text-gray-500 text-xs ml-1">
                  ({question.votes} 评分)
                </span>
              </div>
              {index < (questions?.length || 0) - 1 && (
                <Separator className="mt-3" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 问题组件
export const Question = ({
  questionDetail,
}: {
  questionDetail: QuestionDetail;
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Crumb items={questionDetail.breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <QuestionDetail title={questionDetail.title} />
          <BaziSolution content={questionDetail.content} />
        </div>

        <div className="lg:col-span-1">
          <RelatedQuestions
            category={questionDetail.category}
            questions={questionDetail.relatedQuestions}
          />
        </div>
      </div>
    </div>
  );
};

export default Question;
