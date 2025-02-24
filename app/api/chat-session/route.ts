import { auth } from "@/auth";
import { ChatService } from "@/services/chat/chatService";
import { respData, respErr } from "@/lib/resp";
import { ChatSession, ChatSessionDB, ChatStatus } from "@/types/chat.d";

export async function POST(req: Request) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取请求数据
    const chatData: ChatSessionDB = await req.json();

    // 3. 创建聊天会话
    const chat: ChatSession = await ChatService.createChatSession(chatData);

    // 4. 返回结果
    return respData(chat);
  } catch (error) {
    console.error("创建聊天会话失败:", error);
    return respErr("创建聊天会话失败");
  }
}
