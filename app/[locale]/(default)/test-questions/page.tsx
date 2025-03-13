import React from "react";
import { getQuestionList } from "@/models/question";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic"; // 禁用页面缓存，确保每次访问都获取最新数据

export default async function TestQuestionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const questionList = await getQuestionList({ limit: 100, locale }); // 获取最多100个问题

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">问题数据测试页面</h1>
      <p className="text-gray-600 mb-8">
        这个页面展示了数据库中存储的所有问题数据。每个卡片包含一个问题的详细信息。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionList.items.length > 0
          ? questionList.items.map((question) => (
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
                    分类: {question.category} | 类型: {question.reading_type} |
                    语言: {question.locale}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="prose max-w-none dark:prose-invert line-clamp-4 text-sm">
                    {question.content.substring(0, 200)}...
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      评分: {question.rating || 0} ({question.votes || 0} 票)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Slug: {question.slug}
                  </div>
                  <div className="text-xs text-gray-500">
                    创建时间:{" "}
                    {new Date(question.created_at || "").toLocaleString()}
                  </div>
                  <Button asChild className="mt-4 w-full" size="sm">
                    <Link href={`/${locale}/test-questions/${question.slug}`}>
                      查看详情
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          : // 如果没有数据，显示骨架屏
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-8 w-full mt-4" />
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
}
