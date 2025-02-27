"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatPage } from "@/types/pages/chat";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import Link from "next/link";
import LoadingAnimation from "./LoadingAnimation";
import { IoArrowBack } from "react-icons/io5";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { chatSessionApi } from "@/services/api/chatSession";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { v4 as uuidv4 } from "uuid";
import ChatSkeleton from "./ChatSkeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface AiReader {
  name: string;
  avatar: string;
  description: string;
}

interface ChatInterfaceProps {
  aiReader: AiReader;
  lomessages: ChatPage;
  locale: string;
  chatId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export default function ChatInterface({
  aiReader,
  lomessages,
  locale,
  chatId,
}: ChatInterfaceProps) {
  const params = useParams();
  const { mutate } = useSWRConfig();
  const {
    membership,
    chat: contextChat,
    setChat: setContextChat,
  } = useAppContext();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [lastSavedMessageId, setLastSavedMessageId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const { setOpenMobile } = useSidebar();

  const checkRemainingCredits = async () => {
    setIsLoadingCount(true);
    try {
      const response = await fetch("/api/readings/check");
      const data = await response.json();

      if (data.code === 0) {
        setRemainingCount(data.data.remainingCount);
      }
    } catch (error) {
      console.error("Failed to fetch reading count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  };

  // 初始化聊天会话和历史消息
  useEffect(() => {
    setOpenMobile(false);
    setIsActive(true);
    setIsInitialLoading(true); // 开始加载时设置状态

    const initializeChat = async () => {
      try {
        let chatSession: ChatSession | null = null;

        if (
          contextChat?.uuid &&
          contextChat.status === ChatStatus.New &&
          chatId === contextChat.uuid
        ) {
          chatSession = await chatSessionApi.create(contextChat);
          append({ role: "user", content: contextChat.title });
        } else {
          if (chatId) {
            chatSession = await chatSessionApi.get(chatId);
          }
        }

        if (isActive && chatSession) {
          setContextChat(chatSession);
          // console.log("chatSession", chatSession);

          // 如果会话是新会话，发送标题
          if (contextChat?.status === ChatStatus.New && contextChat.title) {
            // append({ role: "user", content: contextChat.title });
          }
          // 如果会话已经创建，加载历史消息
          else {
            const messagesHistory = await chatSessionApi.getMessages(
              chatSession.uuid
            );

            if (messagesHistory) {
              // 直接设置初始消息
              setInitialMessages(
                messagesHistory.map((msg) => ({
                  id: msg.id || "",
                  role: msg.role as "user" | "assistant",
                  content: msg.content,
                  reasoning: msg.reasoning_content,
                }))
              );
            }
            setIsInitialLoading(false); // 加载完成后设置状态
          }
        }
      } catch (error) {
        console.error("初始化聊天会话失败:", error);
        if (isActive) {
          toast.error(lomessages.errors.failedToLoadChat);
          setIsInitialLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      setIsActive(false);
      setInitialMessages([]);
      setLastSavedMessageId("");
    };
  }, [chatId]);

  const {
    append,
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
  } = useChat({
    api: `/api/chat-completion/${chatId}`,
    id: chatId,
    initialMessages,
    body: {
      locale,
      customer_info: contextChat?.customer_info,
      session_id: chatId,
    },
    generateId: uuidv4,
    onFinish: () => {
      // setIsLoading(false);
      // 确保使用正确的路径触发 SWR 缓存更新
      console.log("聊天完成，更新聊天会话列表");
      mutate("/api/chat-session");
    },
  });

  // 监听消息变化并保存
  useEffect(() => {
    if (!isActive || !chatId || messages.length === 0) return;

    const saveMessage = async () => {
      const lastMessage = messages[messages.length - 1];

      // 如果这条消息已经保存过，直接返回
      if (lastMessage.id === lastSavedMessageId) return;

      try {
        // 保存最新消息
        await chatSessionApi.saveMessage(chatId, {
          session_id: chatId,
          role: lastMessage.role as "user" | "assistant",
          content: lastMessage.content,
          reasoning_content: lastMessage.reasoning,
          id: lastMessage.id,
        });

        // 更新最后保存的消息ID
        setLastSavedMessageId(lastMessage.id);

        // 更新会话状态
        if (
          lastMessage.role === "assistant" &&
          contextChat?.status === ChatStatus.New
        ) {
          const updatedChat = await chatSessionApi.updateStatus(
            chatId,
            ChatStatus.Created
          );
          setContextChat({
            ...contextChat,
            status: ChatStatus.Created,
          });
        }
        // console.log("contextChat", contextChat);
      } catch (error) {
        console.error("保存消息失败:", error);
        // toast.error(lomessages.errors.failedToSaveMessage);
      }
    };

    saveMessage();
  }, [isLoading, isActive, chatId]);

  // 在AI 开始回复时更新剩余次数
  useEffect(() => {
    if (!isLoading) {
      checkRemainingCredits();
    }
  }, [isLoading]);

  // 创建一个ref来存储消息容器
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 滚动到底部的函数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 监听消息变化，只在用户发送消息时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // 只在最后一条消息是用户消息时滚动
      if (lastMessage.role === "user") {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    try {
      // 直接发送消息，让后端处理权限检查
      await originalHandleSubmit(e);
    } catch (error) {
      console.error(error);
      toast.error(lomessages.errors.generalError);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-background text-foreground">
      {/* 顶部 AI Reader 信息层 */}
      <div className="flex-none">
        <div className="container max-w-6xl mx-auto px-2 pt-2 sm:px-4 sm:pt-4">
          <div className="bg-card text-card-foreground backdrop-blur-sm rounded-lg shadow-sm border border-border p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {/* <div className="flex-shrink-0">
                <Link href={`/${locale}`} className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center text-muted-foreground hover:text-foreground h-12 w-12 sm:h-14 sm:w-14 justify-center"
                  >
                    <IoArrowBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </div> */}
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
          {isInitialLoading ? (
            <ChatSkeleton />
          ) : (
            <>
              {messages.map((message) => (
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
                        // 不显示图片
                        img: () => null,
                      }}
                    >
                      {message.content.trim()}
                    </Markdown>
                  </div>
                </div>
              ))}

              {/* 用于滚动的空div */}
              <div ref={messagesEndRef} />

              {/* 消息加载动画 */}
              {(() => {
                // 确保有消息且正在加载
                if (!isLoading || messages.length === 0) {
                  return null;
                }

                const lastMessage = messages[messages.length - 1];

                // 如果最后一条消息是用户的，并且正在加载，显示动画
                if (lastMessage && lastMessage.role === "user" && isLoading) {
                  return (
                    <div className="flex justify-center">
                      <div className="p-4">
                        <LoadingAnimation messages={lomessages} />
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </>
          )}
        </div>
      </div>

      {/* 底部输入框和版权信息层 */}
      <div className="flex-none">
        <div className="container max-w-6xl mx-auto px-1 pb-1 space-y-1">
          {!isLoadingCount &&
            membership?.status !== "active" &&
            remainingCount !== null &&
            remainingCount >= 0 && (
              <div className="text-sm text-center flex items-center justify-center gap-2">
                <p className="text-muted-foreground">
                  {lomessages.credits.remaining.replace(
                    "{count}",
                    remainingCount.toString()
                  )}
                  <Link
                    href="/#pricing"
                    className="text-primary hover:underline ml-2"
                  >
                    {lomessages.credits.upgrade}
                  </Link>
                </p>
              </div>
            )}
          <form onSubmit={handleSubmit} className="px-2">
            <div className="relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) {
                      handleSubmit(e as any);
                    }
                  }
                }}
                placeholder={lomessages.placeholder}
                disabled={isLoading}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-card pr-12 pl-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={2}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 bottom-1/2 transform translate-y-1/2 h-11 px-4 text-sm"
              >
                {lomessages.send}
              </Button>
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
