"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiChatHistoryLine, RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatSession, ChatSessionDB } from "@/types/chat";

export default function ChatSessionLibrary({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<ChatSessionDB[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchChatSessions() {
      try {
        setLoading(true);
        const response = await fetch(`/api/chat-session`);
        if (!response.ok) throw new Error("获取聊天记录失败");

        const result = await response.json();
        console.log("API 返回数据:", result); // 添加调试日志
        const data = result.data || [];
        setSessions(data);
      } catch (error) {
        console.error("获取聊天会话失败:", error);
        toast.error("无法加载聊天历史记录");
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchChatSessions();
    }
  }, [userId]);

  const handleSessionClick = (sessionId: string) => {
    if (loading) return;

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

      setSessions(sessions.filter((session) => session.uuid !== sessionId));
      toast.success("聊天记录已删除");
    } catch (error) {
      console.error("删除聊天会话失败:", error);
      toast.error("删除聊天记录失败");
    }
  };

  if (loading) {
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
          {sessions.map((session) => (
            <li
              key={session.uuid}
              onClick={() => handleSessionClick(session.uuid)}
              className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-muted cursor-pointer"
            >
              <div className="flex items-center">
                <RiChatHistoryLine className="mr-2 h-4 w-4" />
                <span className="truncate max-w-[150px]">{session.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteSession(e, session.uuid)}
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
