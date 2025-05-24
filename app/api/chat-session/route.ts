import { auth } from "@/auth";
import { ChatService } from "@/services/chat/chatService";
import { respData, respErr } from "@/lib/resp";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { createChatSession } from "@/models/chat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取请求数据
    const chatData: ChatSession = await req.json();

    console.log("chatData", chatData);
    // 3. 创建聊天会话
    const chat: ChatSession = await createChatSession(chatData);

    // 4. 返回结果
    return respData(chat);
  } catch (error) {
    console.error("创建聊天会话失败:", error);
    return respErr("创建聊天会话失败");
  }
}

export async function GET(req: Request) {
  try {
    // 1. 验证用户身份
    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取请求数据 - 使用 uuid 而不是 id
    const userUuid = session.user.uuid;

    // 3. 获取聊天会话
    const chatService = new ChatService();
    const chatSessions = await chatService.getChatSessionsByUserId(userUuid);

    // 4. 返回结果
    return respData(chatSessions);
  } catch (error) {
    console.error("获取聊天会话失败:", error);
    return respErr("获取聊天会话失败");
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取请求数据
    const { uuid } = await req.json();

    // 3. 删除聊天会话
    const chatService = new ChatService();
    await chatService.deleteChatSession(uuid);

    // 4. 返回结果
    return respData({ message: "会话已删除" });
  } catch (error) {
    console.error("删除聊天会话失败:", error);
    return respErr("删除聊天会话失败");
  }
}
