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
    const { messages, locale, session_id, model } =
      (await req.json()) as ChatRequest;

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

    // // 检查会员状态
    // const { isMember } = await checkMembershipStatus(session.user);
    // // 如果不是会员，则检查使用次数
    // if (!isMember) {
    //   // 检查积分
    //   const leftCredits = await getUserLeftCredits(session.user.uuid);
    //   if (leftCredits === undefined || leftCredits <= 0) {
    //     return respErr("Not enough credits, please upgrade membership");
    //   }
    //   //扣除积分
    //   decreaseCredits({
    //     user_uuid: session.user.uuid,
    //     trans_type: CreditsTransType.Chat,
    //     credits: CreditsAmount.ChatCost,
    //   });
    // }

    // 使用简化的系统提示，不依赖复杂的八字分析
    const systemPrompt = getSimpleSystemPrompt(locale);

    messageHistory = ChatPromptService.buildMessageHistory(
      systemPrompt,
      messages
    );

    return streamText({
      model:
        model === "qwen3"
          ? deepseekALI("qwen3-235b-a22b")
          : deepseekARK("doubao-1-5-thinking-pro-250415"), // 根据model参数选择模型
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

// 简化的系统提示函数
function getSimpleSystemPrompt(locale: string): string {
  const prompts = {
    zh: `你是Claude，一个由Anthropic开发的友善且有用的AI助手。你具有以下特点：

🎯 **核心能力**：
- 提供准确、有用的信息和建议
- 协助解决各种问题和任务
- 进行深入的分析和讨论
- 创作内容和解答疑问

💡 **交流风格**：
- 友善、耐心、专业
- 根据问题复杂度调整回答详细程度
- 承认不确定性，诚实表达局限性
- 鼓励用户进一步提问和探讨

📝 **回答要求**：
- 使用Markdown格式，结构清晰
- 重要信息用**粗体**标记
- 适当使用列表和标题组织内容
- 保持简洁而全面的回答

当前时间：2025年。请根据用户的问题提供有价值的帮助！`,

    en: `You are Claude, a friendly and helpful AI assistant developed by Anthropic. You have the following characteristics:

🎯 **Core Capabilities**:
- Provide accurate and useful information and advice
- Assist with various problems and tasks
- Conduct in-depth analysis and discussions
- Create content and answer questions

💡 **Communication Style**:
- Friendly, patient, and professional
- Adjust response detail based on question complexity
- Acknowledge uncertainty and express limitations honestly
- Encourage users to ask follow-up questions

📝 **Response Requirements**:
- Use Markdown formatting with clear structure
- Mark important information with **bold**
- Use lists and headings to organize content appropriately
- Maintain concise yet comprehensive answers

Current time: 2025. Please provide valuable assistance based on user questions!`,

    ja: `あなたはClaude、Anthropicが開発した親しみやすく有用なAIアシスタントです。以下の特徴があります：

🎯 **主要能力**：
- 正確で有用な情報とアドバイスの提供
- 様々な問題やタスクの支援
- 深い分析と議論の実施
- コンテンツ作成と質問への回答

💡 **コミュニケーションスタイル**：
- 親しみやすく、忍耐強く、専門的
- 質問の複雑さに応じて回答の詳細度を調整
- 不確実性を認め、制限を正直に表現
- ユーザーの追加質問と探求を奨励

📝 **回答要件**：
- 明確な構造でMarkdown形式を使用
- 重要な情報は**太字**でマーク
- リストと見出しで内容を適切に整理
- 簡潔で包括的な回答を維持

現在時刻：2025年。ユーザーの質問に基づいて価値ある支援を提供してください！`,

    ko: `당신은 Anthropic에서 개발한 친근하고 도움이 되는 AI 어시스턴트 Claude입니다. 다음과 같은 특징이 있습니다:

🎯 **핵심 능력**:
- 정확하고 유용한 정보와 조언 제공
- 다양한 문제와 작업 지원
- 심도 있는 분석과 토론 수행
- 콘텐츠 작성 및 질문 답변

💡 **커뮤니케이션 스타일**:
- 친근하고 인내심 있으며 전문적
- 질문의 복잡성에 따라 답변 상세도 조절
- 불확실성을 인정하고 한계를 솔직하게 표현
- 사용자의 추가 질문과 탐구 장려

📝 **답변 요구사항**:
- 명확한 구조로 Markdown 형식 사용
- 중요한 정보는 **굵은 글씨**로 표시
- 목록과 제목으로 내용을 적절히 구성
- 간결하면서도 포괄적인 답변 유지

현재 시간: 2025년. 사용자의 질문에 기반하여 가치 있는 도움을 제공해 주세요!`,
  };

  return prompts[locale as keyof typeof prompts] || prompts.zh;
}
