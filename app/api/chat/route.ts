// app/api/chat/route.ts
import { ChatService } from "@/services/chat/chatService";
import { ChatRequest } from "@/types/chat";
import { getChatSystemPrompt } from "@/i18n/prompts/chat";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { checkMembershipStatus } from "@/services/membership";
import { checkReadingPermission, recordReading } from "@/services/reading";
import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

const deepseekARK = createDeepSeek({
  apiKey: process.env.ARK_API_KEY ?? "",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

const deepseekALI = createDeepSeek({
  apiKey: process.env.ALI_API_KEY ?? "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(req: Request) {
  try {
    const { isInitializing, messages, customerId, locale } =
      (await req.json()) as ChatRequest;

    // 获取当前用户
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            message: "未登录",
            code: "UNAUTHORIZED",
          },
        }),
        { status: 401 }
      );
    }

    // 检查会员状态
    const { isMember } = await checkMembershipStatus(session.user);
    // 如果不是会员，则检查使用次数
    if (!isMember) {
      // 检查使用次数
      const checkResult = await checkReadingPermission(session.user);

      if (!checkResult.canRead) {
        return new Response(
          JSON.stringify({
            error: {
              message: "没有剩余使用次数",
              code: "NO_REMAINING_READINGS",
            },
          }),
          { status: 403 }
        );
      }

      // 记录使用次数
      try {
        await recordReading(session.user);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: {
              message: "记录使用次数失败",
              code: "RECORD_USAGE_ERROR",
            },
          }),
          { status: 403 }
        );
      }
    }

    // 获取八字分析
    const baziAnalysis = await ChatService.getBaziAnalysis(customerId);
    const systemPrompt = getChatSystemPrompt(locale, baziAnalysis);

    try {
      if (isInitializing) {
        const initialMessage = await ChatService.buildInitialMessage(
          customerId,
          locale
        );
        const initialMessages = ChatService.buildMessageHistory(systemPrompt, [
          { role: "user", content: initialMessage },
        ]);

        // console.log('=== Initial Messages ===');
        // console.log(JSON.stringify(initialMessages, null, 2));
        return streamText({
          model: deepseekARK("ep-20250205155325-bsdb5"), // r1
          // model: deepseekARK("ep-20250208110123-np259"), // deepseek-qwen-32B
          // model: deepseekARK("ep-20250210120542-75dn2"), // deepseek-qwen-7B
          // model: deepseekALI('deepseek-r1'),
          messages: initialMessages,
          maxTokens: 8000,
        }).toDataStreamResponse({
          sendReasoning: true,
        });
      }

      const messageHistory = ChatService.buildMessageHistory(
        systemPrompt,
        messages
      );

      // console.log('=== Processed Messages ===');
      // console.log(JSON.stringify(messageHistory, null, 2));

      return streamText({
        model: deepseekARK("ep-20250205155325-bsdb5"), //r1
        // model: deepseekARK("ep-20250208110123-np259"),  // deepseek-qwen-32B
        // model: deepseekARK("ep-20250210120542-75dn2"), // deepseek-qwen-7B
        // model: deepseekALI('deepseek-r1'),
        messages: messageHistory,
        maxTokens: 8000,
      }).toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error: any) {
      console.error("DeepSeek API error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "AI服务暂时不可用",
            code: "AI_SERVICE_UNAVAILABLE",
            details: error?.message || "未知错误",
          },
        }),
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}
