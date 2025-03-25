import React from "react";
import { getQuestionDetail } from "@/models/question";
import { notFound } from "next/navigation";
import Image from "next/image";
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
import QuestionSelector from "@/components/blocks/question-selector";
import { getReaderPage, getQuestionSelectorBlock } from "@/services/page";
import { ArrowLeftIcon } from "lucide-react";
import Crumb from "@/components/blocks/crumb";

// 获取页面参数
interface PageParams {
  params: {
    slug: string;
    locale: string;
    category: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = "en";
  const question = await getQuestionDetail(params.slug, locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-calculator/${params.slug}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${params.locale}/chinese-zodiac-calculator/${params.slug}`;
  }

  return {
    title: `${question?.title} | Chinese Zodiac AI`,
    description: `${question?.description} | Chinese Zodiac AI`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function QuestionDetailPage({ params }: PageParams) {
  const { slug, locale } = params;

  // 获取问题详情
  const question = await getQuestionDetail(slug, "en");

  // 如果问题不存在，显示404页面
  if (!question) {
    notFound();
  }

  // 获取问题选择器和阅读页面数据
  const readerPage = await getReaderPage(locale);
  const questionSelector = await getQuestionSelectorBlock(locale);

  return (
    <div className="container px-3 sm:px-4 md:px-6 py-10 mx-auto">
      <div className="mb-4">
        <Crumb
          items={[
            { title: "home", url: "/" },
            {
              title: "chinese-zodiac",
              url: `/chinese-zodiac-calculator`,
            },
            {
              title: question.title,
              url: `/chinese-zodiac-calculator/${params.slug}`,
            },
          ]}
        />
      </div>

      <div className="flex flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="outline" asChild className="w-auto">
          <Link href="javascript:history.back()">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Question Details</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="w-full">
          <CardHeader className="px-3 sm:px-6">
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
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <span>
                  Category: <Badge>{question.category}</Badge>
                </span>
                <span>
                  Reading Type:{" "}
                  <Badge variant="outline">{question.reading_type}</Badge>
                </span>
                <span>
                  Language: <Badge variant="secondary">{question.locale}</Badge>
                </span>
                <span>
                  Rating: {question.rating || 0} ({question.votes || 0} votes)
                </span>
              </div>
            </CardDescription>
          </CardHeader>

          {question.cover_url && (
            <div className="w-full flex justify-center mb-6">
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                <Image
                  src={question.cover_url}
                  alt={question.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <CardContent className="px-3 sm:px-6">
            {/* 使用Markdown组件来渲染内容 */}
            <Markdown
              content={question.content.replace(/^\s*#\s+.*?(?:\r?\n|$)/, "")}
            />
            {/* 替换CTA按钮为问题选择器 */}
            <div className="mt-8">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-primary">
                  Ready to Get Your Personalized Answer?
                </h3>
                <p className="text-gray-600 mt-2">
                  Ask this question now and receive insights tailored just for
                  you
                </p>
              </div>
              <QuestionSelector
                formMessages={readerPage}
                questionSelector={questionSelector}
                defaultQuestion={question.title}
                defaultReadingType={
                  question.reading_type as "single" | "double"
                }
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-4 px-3 sm:px-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tags:</h3>
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
                  <h3 className="text-lg font-semibold mb-2">
                    Related Questions:
                  </h3>
                  <ul className="list-disc pl-4 sm:pl-6">
                    {question.relatedQuestions.map((related) => (
                      <li key={related.slug} className="mb-2">
                        <Link
                          href={`/${locale}/chinese-zodiac-calculator/${related.slug}`}
                          className="text-blue-600 hover:underline text-sm sm:text-base"
                        >
                          {related.title}
                        </Link>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">
                          (Rating: {related.rating} | {related.votes} votes)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 w-full">
              <div>Slug: {question.slug}</div>
              <div>
                Created at:{" "}
                {new Date(question.created_at || "").toLocaleString()}
              </div>
              <div>
                Updated at:{" "}
                {new Date(question.updated_at || "").toLocaleString()}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
