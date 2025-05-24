import { auth } from "@/auth";
import { ChatService } from "@/services/chat/chatService";
import { respData, respErr } from "@/lib/resp";
import { NextResponse } from "next/server";
import { getChatSessionByUuid } from "@/models/chat";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取聊天会话
    const chat = await getChatSessionByUuid(params.chatId);
    if (!chat) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }

    // 3. 验证权限
    if (chat.user_uuid !== session.user.uuid) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return respData(chat);
  } catch (error) {
    console.error("获取聊天会话失败:", error);
    return respErr("获取聊天会话失败");
  }
}

// 添加 PUT 方法的处理
export async function PUT(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    const { status } = await request.json();

    // 实例化ChatService并调用正确的方法名
    const chatService = new ChatService();
    const updatedChat = await chatService.updateChatSessionStatus(
      chatId,
      status
    );

    return respData(updatedChat);
  } catch (error) {
    console.error("更新聊天状态失败:", error);
    return respErr("更新聊天状态失败");
  }
}
