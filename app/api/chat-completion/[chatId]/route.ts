// app/api/chat/route.ts
import { ChatPromptService } from "@/services/chat/chatPromptService";
import { ChatRequest } from "@/types/chat";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { checkMembershipStatus } from "@/services/membership";
import { checkReadingPermission, recordReading } from "@/services/reading";
import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { CookingPot } from "lucide-react";

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

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const {
      messages,
      customer_info,
      locale,
      session_id,
      is_matching,
      partner_info,
    } = (await req.json()) as ChatRequest;
    const chatId = params.chatId;
    // console.log("chatId: ", chatId);
    // 验证会话ID
    if (!chatId) {
      return new Response(
        JSON.stringify({
          error: {
            message: "缺少会话ID",
            code: "MISSING_SESSION_ID",
          },
        }),
        { status: 400 }
      );
    }

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

    try {
      let systemPrompt = "";
      if (is_matching && partner_info) {
        systemPrompt = await ChatPromptService.buildMatchingSystemPrompt(
          customer_info,
          partner_info,
          locale
        );
      } else {
        systemPrompt = await ChatPromptService.buildSystemPrompt(
          customer_info,
          locale
        );
      }
      const messageHistory = ChatPromptService.buildMessageHistory(
        systemPrompt,
        messages
      );
      //console.log("systemPrompt: ", systemPrompt);

      return streamText({
        model: deepseekARK("ep-20250205155325-bsdb5"), //r1
        // model: deepseekARK("ep-20250208110123-np259"), // deepseek-qwen-32B
        // model: deepseekARK("ep-20250228181734-xc4qb"), // doubao-lite
        // model: deepseekALI('deepseek-r1'),
        // model: deepseekALI("qwen-max-latest"),
        // model: deepseekALI("qwen2.5-vl-7b-instruct"),
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
