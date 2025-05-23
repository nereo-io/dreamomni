"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, SparklesIcon, X } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import TextareaAutosize from "react-textarea-autosize";
import { QuestionSelector as QuestionSelectorType } from "@/types/blocks/question-selector";
import Link from "next/link";
import { CreditExhaustedModal } from "@/components/ui/credit-exhausted-modal";
import { QuestionExamples } from "@/types/blocks/question-examples";
import React from "react";

interface Props {
  questionSelector: QuestionSelectorType;
  questionExamples?: QuestionExamples;
  defaultQuestion?: string;
  model?: "r1" | "qwen3";
}

export default function QuestionSelector({
  questionSelector,
  questionExamples,
  defaultQuestion = "",
  model = "r1",
}: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState(defaultQuestion);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // 获取用户信息
  const {
    user,
    setShowSignModal,
    membership,
    isLoadingMembership,
    setChat,
    leftCredits,
    updateCredits,
  } = useAppContext();

  const handleQuestionClick = (text: string) => {
    setQuestion(text);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = () => {
    // 1. 检查登录状态
    if (!user?.uuid) {
      toast.message(questionSelector.errors.pleaseLogin);
      setShowSignModal(true);
      return;
    }

    // 2. leftCredits为0，非会员时
    if (leftCredits <= 0 && membership?.status !== "active") {
      // toast.error(questionSelector.errors.noRemainingReadings);
      setShowCreditModal(true);
      // router.push("/pricing");
      return;
    }

    if (question.trim()) {
      const chat: ChatSession = {
        uuid: uuidv4(),
        user_uuid: user.uuid,
        title: question,
        status: ChatStatus.New,
        created_at: new Date(),
        model: model,
      };
      setChat(chat);
      // console.log(chat);

      const jump_url = `/chat/${chat.uuid}`;
      router.push(jump_url);
    }
  };

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSubmit();
    }
  };

  return (
    <section className="pt-2 md:pt-4">
      <div className="container px-4 md:px-6 max-w-4xl">
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-3xl">
            {/* 输入区域 */}
            <div className="relative mb-4 md:mb-4 overflow-hidden rounded-lg border bg-white dark:bg-background transition-colors duration-200 focus-within:border-orange-500">
              <TextareaAutosize
                value={question}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                minRows={2}
                maxRows={15}
                placeholder={
                  questionSelector.placeholder ||
                  "Type your question here or select from suggestions below..."
                }
                className="w-full pb-12 px-3 pt-2 text-base md:text-lg resize-none border-none outline-none focus:outline-none focus:ring-0 bg-transparent"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                {membership?.status !== "active" && (
                  <Link
                    href="/my-credits"
                    className="cursor-pointer hover:opacity-80"
                  >
                    <div className="text-sm text-muted-foreground flex items-center mr-2">
                      <SparklesIcon className="h-4 w-4 mr-1 text-primary" />
                      <span className="font-medium text-primary">
                        {leftCredits}
                      </span>
                    </div>
                  </Link>
                )}

                <Button
                  onClick={handleSubmit}
                  className="bg-orange-500 hover:bg-orange-600 h-9 px-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {questionSelector.send || "发送"}
                </Button>
              </div>
            </div>

            {/* 添加示例问题类别 */}
            {questionExamples && (
              <div className="mb-4 rounded-md text-center">
                <span className="text-sm">
                  {questionExamples?.title}
                  {questionExamples?.examples.map((example, index) => (
                    <React.Fragment key={example.text}>
                      {index > 0 && <span className="text-gray-500">·</span>}
                      <button
                        onClick={() => handleQuestionClick(example.text)}
                        className="text-primary hover:text-primary/80 hover:underline mx-1 font-medium"
                      >
                        {example.label}
                      </button>
                    </React.Fragment>
                  ))}
                </span>
              </div>
            )}

            {/* Credit模态框 */}
            <CreditExhaustedModal
              open={showCreditModal}
              onOpenChange={setShowCreditModal}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
