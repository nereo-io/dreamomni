"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RiChatHistoryLine, RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatSessionDB } from "@/types/chat";
import useSWR from "swr";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatPage } from "@/types/pages/chat";

export default function ChatSessionLibrary({
  userId,
  currentChatId,
  messages,
}: {
  userId: string;
  currentChatId?: string;
  messages: ChatPage;
}) {
  const { state } = useSidebar(); // 获取 sidebar 的状态
  const router = useRouter();
  const pathname = usePathname();
  // 获取侧边栏控制函数
  const { setOpenMobile } = useSidebar();
  // 定义 fetcher 函数
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(messages.library.fetchFailed);
    }
    return res.json();
  };

  // 使用 SWR 获取聊天会话数据
  const { data, error, isLoading, mutate } = useSWR(
    "/api/chat-session",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  // 从 SWR 响应中提取会话数据
  const sessions: ChatSessionDB[] = data?.data || [];

  const handleSessionClick = (sessionId: string) => {
    if (isLoading) return;
    setOpenMobile(false);
    // 导航到选定的聊天会话
    router.push(`/chat/${sessionId}`, { scroll: false });
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chat-session`, {
        method: "DELETE",
        body: JSON.stringify({ uuid: sessionId }),
      });

      if (!response.ok) throw new Error(messages.library.deleteFailed);

      mutate();
      toast.success(messages.library.deleteSuccess);
    } catch (error) {
      console.error("删除聊天会话失败:", error);
      toast.error(messages.library.deleteFailed);
    }
  };

  if (error) {
    console.error("获取聊天会话失败:", error);
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <RiChatHistoryLine className="h-4 w-4" />
          {messages.library.title}
        </h3>
        <div className="text-xs text-muted-foreground">
          {messages.library.loadFailed}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <RiChatHistoryLine className="h-4 w-4" />
          {messages.library.title}
        </h3>
        <div className="text-xs text-muted-foreground">
          {messages.library.loading}
        </div>
      </div>
    );
  }

  return (
    <div className={`${state === "collapsed" ? "hidden" : "block"}`}>
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <RiChatHistoryLine className="h-4 w-4" />
          {messages.library.title}
        </h3>
        {/* 只在展开状态显示内容 */}
        {sessions.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            {messages.library.noHistory}
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session: ChatSessionDB) => (
              <li
                key={session.uuid}
                onClick={() => handleSessionClick(session.uuid)}
                className={`flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted cursor-pointer ${
                  session.uuid === currentChatId
                    ? "bg-muted/80 border border-border/50"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`truncate max-w-[150px] ${
                      session.uuid === currentChatId ? "font-medium" : ""
                    }`}
                  >
                    {session.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDeleteSession(e, session.uuid)}
                >
                  <RiDeleteBin6Line className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
