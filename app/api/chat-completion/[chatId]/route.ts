// app/api/chat/route.ts
import { ChatPromptService } from "@/services/chat/chatPromptService";
import { ChatRequest } from "@/types/chat";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { checkMembershipStatus } from "@/services/membership";
import { getUserLeftCredits } from "@/models/credit";
import {
  decreaseCredits,
  CreditsTransType,
  CreditsAmount,
} from "@/services/credit";
import { auth } from "@/auth";
import { respErr, respJson } from "@/lib/resp";

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
      is_iching,
      hexagramLines,
      hexagramData,
      model,
    } = (await req.json()) as ChatRequest;

    // console.log("model: ", model);

    const chatId = params.chatId;
    let messageHistory;
    // 验证会话ID
    if (!chatId) {
      return respErr("missing chat id");
    }
    // 获取当前用户
    const session = await auth();
    if (!session?.user) {
      return respErr("no auth");
    }

    // 如果是八字解读，按照原来的逻辑处理
    if (is_iching === false) {
      // 检查会员状态
      const { isMember } = await checkMembershipStatus(session.user);
      // 如果不是会员，则检查使用次数
      if (!isMember) {
        // 检查积分
        const leftCredits = await getUserLeftCredits(session.user.uuid);
        if (leftCredits === undefined || leftCredits <= 0) {
          return respErr("Not enough credits, please upgrade membership");
        }
        //扣除积分
        decreaseCredits({
          user_uuid: session.user.uuid,
          trans_type: CreditsTransType.Chat,
          credits: CreditsAmount.ChatCost,
        });
      }

      let systemPrompt = "";
      if (is_matching && partner_info) {
        systemPrompt = await ChatPromptService.buildMatchingSystemPrompt(
          session_id,
          customer_info,
          partner_info,
          locale
        );
      } else {
        systemPrompt = await ChatPromptService.buildSystemPrompt(
          session_id,
          customer_info,
          locale
        );
      }
      messageHistory = ChatPromptService.buildMessageHistory(
        systemPrompt,
        messages
      );
      //console.log("systemPrompt: ", systemPrompt);
    } else {
      if (!hexagramLines || !hexagramData) {
        return respErr("missing hexagram lines or result");
      }
      let systemPrompt = await ChatPromptService.buildIchingSystemPrompt(
        session_id,
        hexagramLines,
        hexagramData,
        locale
      );
      messageHistory = ChatPromptService.buildMessageHistory(
        systemPrompt,
        messages
      );
      // console.log("messageHistory: ", messageHistory);
    }

    return streamText({
      // model: deepseek("deepseek-reasoner"),
      // model: deepseek("deepseek-chat"),
      // model: deepseekARK("ep-20250205155325-bsdb5"), //r1
      // model: deepseekARK("ep-20250208110123-np259"), // deepseek-qwen-32B
      model:
        model === "qwen3"
          ? deepseekALI("qwen3-235b-a22b")
          : deepseekARK("doubao-1-5-thinking-pro-250415"), // 根据model参数选择模型
      // model: deepseekARK("ep-20250228181734-xc4qb"), // doubao-lite
      // model: deepseekALI("deepseek-r1"),
      // model: deepseekALI("qwen-max-latest"),
      // model: deepseekALI("qwen2.5-vl-7b-instruct"),
      messages: messageHistory,
      maxTokens: 8000,
    }).toDataStreamResponse({
      sendReasoning: true,
    });
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}
