"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatPage } from "@/types/pages/chat";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingAnimation from "./LoadingAnimation";
import { IoArrowBack } from "react-icons/io5";

interface AiReader {
  name: string;
  avatar: string;
  description: string;
}

interface ChatInterfaceProps {
  aiReader: AiReader;
  customerId: string;
  lomessages: ChatPage;
  locale: string;
}


export default function ChatInterface({
  aiReader,
  customerId,
  lomessages,
  locale,
}: ChatInterfaceProps) {
  // const { membership } = useAppContext();
  // const isMember = membership?.status === "active";

  const [isInitialized, setIsInitialized] = useState(false);
  const {
    append,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    // handleSubmit: originalHandleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: "chat",
    body: {
      customerId,
      locale,
      isInitializing: !isInitialized,
    },
    onResponse: (response) => {
      if (!isInitialized) {
        setIsInitialized(true);
      }
    },
  });

  const searchParams = useSearchParams();
  
  useEffect(() => {
    const encodedQuestion = searchParams.get('q');
    if (encodedQuestion) {
      try {
        // 先解码Base64，再解码URL编码
        const decodedQuestion = decodeURIComponent(atob(encodedQuestion));
        append({ role: "user", content: decodedQuestion });
      } catch (error) {
        console.error('Failed to decode question:', error);
      }
    }
  }, [searchParams]);

  // 处理消息提交
  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   // 检查会员状态
  //   if (!isMember) {
  //     toast.error("需要开通会员才可以使用");
  //     // router.push('/pricing');
  //     return;
  //   }

  //   originalHandleSubmit(e);
  // };

  return (
    <div className="relative h-full flex flex-col bg-background text-foreground">
      {/* 顶部 AI Reader 信息层 */}
      <div className="flex-none">
        <div className="container max-w-6xl mx-auto px-2 pt-2 sm:px-4 sm:pt-4">
          <div className="bg-card text-card-foreground backdrop-blur-sm rounded-lg shadow-sm border border-border p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Link href={`/${locale}`} className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center text-muted-foreground hover:text-foreground h-12 w-12 sm:h-14 sm:w-14 justify-center"
                  >
                    <IoArrowBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                  <img
                    src={aiReader.avatar}
                    alt={aiReader.name}
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: "1/1" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl font-medium text-card-foreground truncate">
                    {aiReader.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {aiReader.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4 px-2 py-2 sm:px-4 sm:py-4">
          {/* 首次加载动画 */}
          {!isInitialized && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              {/* 占位头像 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e9d5a1] to-[#f3e4c0] animate-pulse" />

              {/* 加载动画 */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                {/* <p className="text-gray-500 animate-pulse">
                  {lomessages.loading}
                </p> */}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-lg p-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground backdrop-blur-sm"
                  )}
                >
                  {true && message.reasoning && (
                    <blockquote className="mb-4 border-l-4 border-gray-300 dark:border-gray-700 pl-4 text-sm text-gray-500 dark:text-gray-400">
                      {message.reasoning.trim()}
                    </blockquote>
                  )}
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义列表项渲染，解决换行展示的问题
                      li: ({
                        children,
                        ...props
                      }: React.HTMLProps<HTMLLIElement> & {
                        ordered?: boolean;
                        index?: number;
                      }) => {
                        const content = React.Children.map(
                          children,
                          (child) => {
                            if (typeof child === "string") {
                              return <span>{child}</span>;
                            }
                            return child;
                          }
                        );

                        return (
                          <li className="flex items-start my-2">
                            <span className="flex-shrink-0 min-w-[1.2em]">
                              {props.ordered
                                ? `${(props.index ?? 0) + 1}.`
                                : "•"}
                            </span>
                            <span className="flex-1 -ml-1">{content}</span>
                          </li>
                        );
                      },
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-500 hover:underline"
                          {...props}
                        />
                      ),
                      p: ({ children }) => (
                        <p className="m-0 leading-relaxed">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold my-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold my-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold my-2">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-base font-semibold my-2">
                          {children}
                        </h4>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside my-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside my-2">
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="hidden" />,
                      table: ({ children }) => (
                        <table className="min-w-full my-4 border-collapse border border-gray-200">
                          {children}
                        </table>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="bg-white divide-y divide-gray-200">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-gray-50">{children}</tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border border-gray-200">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content.trim()}
                  </Markdown>
                </div>
              </div>
            ))
          )}

          {/* 消息加载动画 */}
          {(() => {
            // 确保有消息且正在加载
            if (!isLoading || messages.length === 0) {
              return null;
            }

            const lastMessage = messages[messages.length - 1];

            // 如果最后一条消息是用户的，并且正在加载，显示动画
            if (lastMessage && lastMessage.role === 'user' && isLoading) {
              return (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4">
                    <LoadingAnimation messages={lomessages} />
                  </div>
                </div>
              );
            }

            return null;
          })()
          }
        </div>
      </div>

      {/* 底部输入框和版权信息层 */}
      <div className="flex-none">
        <div className="container max-w-6xl mx-auto px-1 pb-1 space-y-1">
          <form
            onSubmit={handleSubmit}
            className="px-2"
          >
            <div className="relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder={lomessages.placeholder}
                disabled={isLoading || !isInitialized}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-card pr-12 pl-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={2}
              />
              <Button
                type="submit"
                disabled={isLoading || !isInitialized}
                className="absolute right-2 bottom-2 h-8 px-4 text-sm"
              >
                {lomessages.send}
              </Button>
              {/* {!isMember && (
                <div className="text-sm text-center flex items-center justify-center gap-2">
                  <p className="text-red-500">
                    {lomessages.membership.required}
                  </p>
                  <Link
                    href="/#pricing"
                    className="text-primary hover:underline"
                  >
                    {lomessages.membership.upgrade}
                  </Link>
                </div>
              )} */}
            </div>
          </form>

          <div className="text-center text-xs md:text-sm text-muted-foreground">
            {lomessages.footer}
          </div>
        </div>
      </div>
    </div>
  );
}
