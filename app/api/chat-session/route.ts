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

export async function GET(req: Request) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    console.log("当前用户:", session?.user);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 获取请求数据 - 使用 uuid 而不是 id
    const userUuid = session.user.uuid;
    console.log("查询用户UUID:", userUuid);

    // 3. 获取聊天会话
    const chatSessions = await ChatService.getChatSessionsByUserId(userUuid);
    console.log("查询到的会话:", chatSessions);

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
    console.log("删除会话的UUID:", uuid);

    // 3. 删除聊天会话
    await ChatService.deleteChatSession(uuid);

    // 4. 返回结果
    return respData({ message: "会话已删除" });
  } catch (error) {
    console.error("删除聊天会话失败:", error);
    return respErr("删除聊天会话失败");
  }
}
