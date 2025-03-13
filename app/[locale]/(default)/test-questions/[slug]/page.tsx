import React from "react";
import { getQuestionDetail } from "@/models/question";
import { notFound } from "next/navigation";
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
import Link from "next/link";
import Markdown from "@/components/markdown";
export const dynamic = "force-dynamic"; // 禁用页面缓存

// 获取页面参数
interface PageParams {
  params: {
    slug: string;
    locale: string;
  };
}

export default async function QuestionDetailPage({ params }: PageParams) {
  const { slug, locale } = params;

  // 获取问题详情
  const question = await getQuestionDetail(slug, locale);

  // 如果问题不存在，显示404页面
  if (!question) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href={`/${locale}/test-questions`}>返回问题列表</Link>
        </Button>
        <h1 className="text-3xl font-bold">问题详情</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={question.author_avatar_url || ""}
                  alt={question.author_name || "匿名"}
                />
                <AvatarFallback>
                  {(question.author_name || "匿名").substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {question.author_name || "匿名"}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(question.created_at || "").toLocaleString()}
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl">{question.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex flex-wrap gap-4">
                <span>
                  分类: <Badge>{question.category}</Badge>
                </span>
                <span>
                  阅读类型:{" "}
                  <Badge variant="outline">{question.reading_type}</Badge>
                </span>
                <span>
                  语言: <Badge variant="secondary">{question.locale}</Badge>
                </span>
                <span>
                  评分: {question.rating || 0} ({question.votes || 0} 票)
                </span>
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 使用Markdown组件来渲染内容 */}
            <Markdown content={question.content} />
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">标签:</h3>
              <div className="flex flex-wrap gap-2">
                {question.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {question.relatedQuestions &&
              question.relatedQuestions.length > 0 && (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-2">相关问题:</h3>
                  <ul className="list-disc pl-6">
                    {question.relatedQuestions.map((related) => (
                      <li key={related.slug} className="mb-2">
                        <Link
                          href={`/${locale}/test-questions/${related.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          {related.title}
                        </Link>
                        <span className="text-sm text-gray-500 ml-2">
                          (评分: {related.rating} | {related.votes} 票)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 w-full">
              <div>Slug: {question.slug}</div>
              <div>
                创建时间: {new Date(question.created_at || "").toLocaleString()}
              </div>
              <div>
                更新时间: {new Date(question.updated_at || "").toLocaleString()}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
