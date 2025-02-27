"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiChatHistoryLine, RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatSession, ChatSessionDB } from "@/types/chat";
import useSWR from "swr";

// 定义 fetcher 函数
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("获取聊天记录失败");
  }
  return res.json();
};

export default function ChatSessionLibrary({
  userId,
  currentChatId,
}: {
  userId: string;
  currentChatId?: string;
}) {
  const router = useRouter();

  // 使用 SWR 获取聊天会话数据
  const { data, error, isLoading, mutate } = useSWR(
    "/api/chat-session",
    fetcher,
    {
      // 移除自动刷新间隔，依赖手动触发和焦点重新验证
      revalidateOnFocus: true, // 当页面获得焦点时重新验证
    }
  );

  // 从 SWR 响应中提取会话数据
  const sessions: ChatSessionDB[] = data?.data || [];

  const handleSessionClick = (sessionId: string) => {
    if (isLoading) return;

    router.push(`/chat/${sessionId}`, { scroll: false });
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    try {
      // 这里需要实现删除聊天会话的API
      const response = await fetch(`/api/chat-session`, {
        method: "DELETE",
        body: JSON.stringify({ uuid: sessionId }),
      });

      if (!response.ok) throw new Error("删除聊天记录失败");

      // 删除成功后重新获取数据
      mutate();
      toast.success("聊天记录已删除");
    } catch (error) {
      console.error("删除聊天会话失败:", error);
      toast.error("删除聊天记录失败");
    }
  };

  if (error) {
    console.error("获取聊天会话失败:", error);
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">聊天历史</h3>
        <div className="text-xs text-muted-foreground">加载失败</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">聊天历史</h3>
        <div className="text-xs text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">聊天历史</h3>
      {sessions.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无聊天记录</div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session: ChatSessionDB) => (
            <li
              key={session.uuid}
              onClick={() => handleSessionClick(session.uuid)}
              className={`flex items-center justify-between text-xs p-2 rounded-md hover:bg-muted cursor-pointer ${
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
                className="h-6 w-6 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteSession(e, session.uuid)}
                onMouseEnter={(e) => {
                  // 只显示当前悬停项的删除按钮
                  e.currentTarget.classList.remove("opacity-0");
                  e.currentTarget.classList.add("opacity-100");
                }}
                onMouseLeave={(e) => {
                  // 鼠标离开时隐藏删除按钮
                  e.currentTarget.classList.remove("opacity-100");
                  e.currentTarget.classList.add("opacity-0");
                }}
              >
                <RiDeleteBin6Line className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
