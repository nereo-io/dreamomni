import { auth } from "@/auth";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { respData, respErr } from "@/lib/resp";
import {
  getChatMessagesByChatSessionId,
  getChatSessionByUuid,
} from "@/models/chat";
import { updateChatSessionTitle } from "@/models/chat";

const deepseekALI = createDeepSeek({
  apiKey: process.env.ALI_API_KEY ?? "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return respErr("未授权");
    }

    // 获取聊天会话
    const chatSession = await getChatSessionByUuid(chatId);
    if (!chatSession) {
      return respErr("聊天会话不存在");
    }

    // 验证权限
    if (chatSession.user_uuid !== session.user.uuid) {
      return respErr("无权限访问此会话");
    }

    // 获取聊天消息
    const { data: messages } = await getChatMessagesByChatSessionId(chatId);
    if (!messages || messages.length === 0) {
      return respErr("没有找到聊天消息");
    }

    // 只取前几条消息用于生成标题（避免内容过长）
    const firstMessages = messages.slice(0, 6);
    const conversationContent = firstMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // 调用AI生成标题
    const { text: generatedTitle } = await generateText({
      model: deepseekALI("qwen3-235b-a22b"),
      messages: [
        {
          role: "system",
          content: `你是一个专业的对话标题生成助手。请根据用户的对话内容，生成一个简洁、准确的标题，总结对话的主要话题。

要求：
1. 标题长度控制在2-15个字符
2. 准确概括对话主题
3. 使用简洁的语言
4. 不要包含标点符号
5. 只返回标题文本，不要其他内容

示例：
用户输入关于天气的对话 → "天气咨询"
用户输入关于编程的对话 → "编程学习"
用户输入关于旅行的对话 → "旅行规划"`,
        },
        {
          role: "user",
          content: `请为以下对话生成一个标题：\n\n${conversationContent}`,
        },
      ],
      maxTokens: 50,
      experimental_providerMetadata: {
        openai: {
          enable_thinking: false,
        },
      },
    });

    const title = generatedTitle.trim();

    // 更新聊天会话标题
    await updateChatSessionTitle(chatId, title);

    return respData({ title });
  } catch (error) {
    console.error("生成标题失败:", error);
    return respErr("生成标题失败");
  }
}
