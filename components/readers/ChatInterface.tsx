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
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { chatSessionApi } from "@/services/api/chatSession";
import { useSWRConfig } from "swr";
import { v4 as uuidv4 } from "uuid";
import ChatSkeleton from "./ChatSkeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { CreditExhaustedModal } from "@/components/ui/credit-exhausted-modal";
import { MessageCircle, Send } from "lucide-react";

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
  reasoning?: string;
  createdAt?: Date;
}

export default function ChatInterface({
  aiReader,
  lomessages,
  locale,
  chatId,
}: ChatInterfaceProps) {
  const { mutate } = useSWRConfig();
  const {
    membership,
    chat: contextChat,
    setChat: setContextChat,
    leftCredits,
    updateLeftCredits,
  } = useAppContext();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [chatTitle, setChatTitle] = useState<string>("");
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const [showCreditModal, setShowCreditModal] = useState(false);

  // 生成智能标题（仅内部使用，不暴露给用户）
  const generateSmartTitle = async () => {
    try {
      const result = await chatSessionApi.generateTitle(chatId);
      setChatTitle(result.title);

      // 更新侧边栏
      mutate("/api/chat-session");
    } catch (error) {
      console.error("生成标题失败:", error);
      // 不显示错误提示给用户，静默处理
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
          // console.log("contextChat", contextChat);
          append({ role: "user", content: contextChat.title });
          chatSession = await chatSessionApi.create(contextChat);
          setChatTitle(contextChat.title);
          setIsInitialLoading(false);
          saveChatMessage({
            role: "user",
            content: contextChat.title,
            id: "",
          });
        } else {
          if (chatId) {
            const messagesHistory = await chatSessionApi.getMessages(chatId);
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
            chatSession = await chatSessionApi.get(chatId);
            setContextChat(chatSession);
            if (chatSession) {
              setChatTitle(chatSession.title);
            }
          }
        }
        if (isActive && chatSession) {
          setIsInitialLoading(false); // 加载完成后设置状态
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
    };
  }, [chatId]);

  const saveChatMessage = async (message: Message) => {
    try {
      // 保存最新消息
      await chatSessionApi.saveMessage(chatId, {
        session_id: chatId,
        role: message.role as "user" | "assistant",
        content: message.content,
        reasoning_content: message.reasoning,
        id: message.id,
      });

      // 更新会话状态
      if (message.role === "user" && contextChat?.status === ChatStatus.New) {
        await chatSessionApi.updateStatus(chatId, ChatStatus.Creating);
        setContextChat({
          ...contextChat,
          status: ChatStatus.Creating,
        });
        console.log("更新会话状态为 Creating");
      } else if (
        message.role === "assistant" &&
        contextChat?.status !== ChatStatus.Created
      ) {
        await chatSessionApi.updateStatus(chatId, ChatStatus.Created);
        setContextChat({
          ...contextChat,
          status: ChatStatus.Created,
        });
        console.log("更新会话状态为 Created");

        // 在AI回复后自动生成智能标题（如果当前标题看起来是简单的用户输入）
        if (chatTitle && (chatTitle.length < 20 || chatTitle === "New Chat")) {
          setTimeout(() => {
            generateSmartTitle();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("保存消息失败:", error);
      toast.error(lomessages.errors.failedToSaveMessage);
    }
  };

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
      session_id: chatId,
      model: contextChat?.model,
    },
    generateId: uuidv4,
    onError: (error) => {
      console.error(error);
      toast.error(lomessages.errors.generalError);
    },
    onResponse: () => {
      mutate("/api/chat-session");
    },
    onFinish: async (message) => {
      saveChatMessage({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
        reasoning: message.reasoning,
      });
    },
  });
  // 注释掉：在isLoading变化时更新积分会导致过多API调用
  // AppContext已经负责管理积分状态
  // useEffect(() => {
  //   updateLeftCredits();
  // }, [isLoading]);

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
      saveChatMessage({
        role: "user",
        content: input,
        id: "",
      });
    } catch (error) {
      console.error(error);
      toast.error(lomessages.errors.generalError);
    }
  };

  return (
    <div className="bg-gradient-to-br from-background via-card to-primary/5 h-screen w-full flex flex-col">
      {/* 优雅的头部区域 */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-primary transition-colors" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-lg text-foreground truncate max-w-md">
                    {chatTitle || "New Chat"}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI assistant powered by Claude
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-transparent">
        <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
          {isInitialLoading ? (
            <ChatSkeleton />
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-4"
                        : "bg-card text-card-foreground mr-4 border border-border"
                    )}
                  >
                    {message.reasoning && (
                      <blockquote className="mb-3 border-l-4 border-primary/30 pl-3 text-sm text-muted-foreground italic bg-muted/30 rounded py-2">
                        <span className="text-primary font-medium">
                          Thinking process:
                        </span>
                        <br />
                        {message.reasoning.trim()}
                      </blockquote>
                    )}
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="m-0 leading-relaxed">{children}</p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold my-3 text-foreground">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold my-2 text-foreground">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold my-2 text-foreground">
                            {children}
                          </h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside my-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside my-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary/30 pl-4 my-3 italic bg-muted/30 rounded py-2">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-muted text-foreground px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto my-3">
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            className="text-primary hover:text-primary/80 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
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
                if (!isLoading || messages.length === 0) {
                  return null;
                }

                const lastMessage = messages[messages.length - 1];

                if (lastMessage && lastMessage.role === "user" && isLoading) {
                  return (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-card rounded-2xl px-4 py-3 shadow-sm border border-border mr-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          <span className="text-muted-foreground text-sm">
                            AI is thinking...
                          </span>
                        </div>
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

      {/* 底部输入区域 */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
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
                placeholder="Type your question..."
                disabled={isLoading}
                className="w-full min-h-[52px] max-h-32 rounded-xl border border-input bg-background px-4 py-3 pr-12 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none shadow-sm"
                rows={1}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted shadow-sm transition-all duration-200"
                size="sm"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </Button>
            </div>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      </div>

      <CreditExhaustedModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
      />
    </div>
  );
}
