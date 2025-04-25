"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  BaziQuestionsData,
  BaziQuestionsMessages,
} from "@/types/blocks/bazi-questions";

interface Props {
  baziQuestions: BaziQuestionsData;
  messages: BaziQuestionsMessages;
}

export default function BaziQuestions({ baziQuestions, messages }: Props) {
  // 默认选择 rednote 分类（小红书热门）
  const [selectedCategory, setSelectedCategory] = useState("rednote");

  // 将问题数据转换为数组，并添加id属性
  const questionList = baziQuestions.questions
    ? Object.entries(baziQuestions.questions).map(([id, question]) => ({
        id,
        text: question.text,
        category: question.category,
        tags: question.tags || [],
        copyCount: question.copyCount || 0,
      }))
    : [];

  // 使用国际化消息中的分类名称
  const categoryMap = messages.categories as Record<string, string>;

  // 根据选中的分类筛选问题
  const filteredQuestions = questionList.filter(
    (q) => q.category === selectedCategory
  );

  // 处理问题点击复制功能
  const handleQuestionClick = (question: { id: string; text: string }) => {
    // 复制文本到剪贴板
    navigator.clipboard
      .writeText(question.text)
      .then(() => {
        // 显示成功提示
        toast.success(messages.copiedToast);

        // 记录复制行为到数据库（通过API）
        fetch("/api/bazi-questions/copy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: question.id,
            deviceInfo: navigator.userAgent,
          }),
        }).catch((error) => {
          console.error("记录复制行为失败:", error);
          // 不影响用户体验，失败时只记录日志
        });
      })
      .catch((err) => {
        console.error("复制失败:", err);
        toast.error("复制失败，请重试");
      });
  };

  return (
    <div id="bazi-questions" className="container mx-auto py-6 px-4">
      {/* 标题部分 */}
      <div className="text-center mb-8">
        <h2 className="text-xl lg:text-3xl font-bold mb-2 text-foreground">
          {messages.title}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {messages.description}
        </p>
      </div>

      {/* 分类标签栏 - 支持横滑 */}
      <div className="relative overflow-hidden">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-2 pb-2 min-w-max">
            {/* 使用数据中的分类ID生成分类按钮，但过滤掉 "all" 分类 */}
            {baziQuestions.categories
              .filter((category) => category.id !== "all")
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {(categoryMap as Record<string, string>)[category.id] ||
                    category.id}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* 添加一个样式，隐藏滚动条但保留滚动功能 */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

      {/* 问题卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map((question) => (
          <Card
            key={question.id}
            className="max-h-56 hover:shadow-md transition-all cursor-pointer relative group overflow-hidden"
            onClick={() => handleQuestionClick(question)}
          >
            <CardContent className="p-4 flex flex-col">
              <p className="text-base mb-3 flex-grow line-clamp-3 overflow-hidden">
                {question.text}
              </p>
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-wrap gap-1 items-center">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <span className="flex items-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect
                        x="8"
                        y="2"
                        width="8"
                        height="4"
                        rx="1"
                        ry="1"
                      ></rect>
                    </svg>
                    {question.copyCount}
                  </span>
                </div>
              </div>
              <span className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {messages.copyHint}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
