"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RiChatHistoryLine, RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatSession } from "@/types/chat";
import useSWR from "swr";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatPage } from "@/types/pages/chat";
import { MessageCircle, Trash2 } from "lucide-react";

export default function ChatSessionLibrary({
  userId,
  currentChatId,
  messages,
}: {
  userId: string;
  currentChatId?: string;
  messages: ChatPage;
}) {
  const { state } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(messages.library.fetchFailed);
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR(
    "/api/chat-session",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const sessions: ChatSession[] = data?.data || [];

  const handleSessionClick = (sessionId: string) => {
    if (isLoading) return;
    setOpenMobile(false);
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
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
          {messages.library.title}
        </h3>
        <div className="text-sm text-muted-foreground">
          {messages.library.loadFailed}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
          {messages.library.title}
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-muted/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${state === "collapsed" ? "hidden" : "block"}`}>
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
          {messages.library.title}
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {messages.library.noHistory}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session: ChatSession) => (
              <div
                key={session.uuid}
                onClick={() => handleSessionClick(session.uuid)}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  session.uuid === currentChatId
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span className="truncate text-sm flex-1 mr-2">
                  {session.title || "New Chat"}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:text-destructive"
                  onClick={(e) => handleDeleteSession(e, session.uuid)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
