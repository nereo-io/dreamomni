"use client";

import { useParams } from "next/navigation";
import ChatSessionLibrary from "./ChatSessionLibrary";
import { ChatPage } from "@/types/pages/chat";
export default function ChatSessionLibraryWrapper({
  userId,
  messages,
}: {
  userId: string;
  messages: ChatPage;
}) {
  const params = useParams();
  const currentChatId = params?.chatId as string;

  return (
    <ChatSessionLibrary
      userId={userId}
      currentChatId={currentChatId}
      messages={messages}
    />
  );
}
