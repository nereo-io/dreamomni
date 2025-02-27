"use client";

import { useParams } from "next/navigation";
import ChatSessionLibrary from "./ChatSessionLibrary";

export default function ChatSessionLibraryWrapper({
  userId,
}: {
  userId: string;
}) {
  const params = useParams();
  const currentChatId = params?.chatId as string;

  return <ChatSessionLibrary userId={userId} currentChatId={currentChatId} />;
}
