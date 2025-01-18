import { CoreMessage, streamText } from "ai";
import { BaziFastApiService } from "@/services/chat/baziAPIService";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getCustomerById } from "@/models/customer";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// 缓存 baziAnalysis 结果
const baziAnalysisCache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const { isInitializing, messages, customerId, locale } = await req.json();

    let baziAnalysis;

    // 只在首次请求或缓存未命中时获取八字分析
    if (!baziAnalysisCache.has(customerId)) {
      baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(
        customerId
      );
      baziAnalysisCache.set(customerId, baziAnalysis);
    } else {
      baziAnalysis = baziAnalysisCache.get(customerId);
    }
    // 创建DeepSeek实例
    const deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    });

    const anthropic = createAnthropic({
      apiKey: process.env.CLAUDE_API_KEY ?? "",
    });

    // 根据语言构建系统提示词
    const systemPrompt =
      locale === "zh"
        ? `你是一位名叫"清风明月"的AI算命大师，擅长八字命理分析。基于以下八字信息进行解答：${baziAnalysis}\n
      你的回答应当：
      1. 分析要全面且有深度，包含四柱、大运、流年等多个维度
      2. 解释要通俗易懂，适当使用比喻
      3. 既要指出优势，也要说明潜在挑战
      4. 每个分析都要给出切实可行的建议
      5. 用markdown格式输出
      6. 今年是2025年`
        : `You are an AI destiny analyst named "Qing", specializing in BaZi analysis. Based on the following birth information: ${baziAnalysis}\n
      Your responses should:
      1. Be comprehensive and deep, speak in English
      2. No specific terms from Chinese metaphysics should be included.
      3. Answers with humor and wit, excels at using metaphors and analogies. 
      4. It should highlight the strengths while also addressing potential challenges.
      5. Provide actionable suggestions for each analysis
      6. Output in markdown format
      7. The current year is 2025`;

    if (isInitializing) {
      console.log("isInitializing:", isInitializing);

      const customerData = await getCustomerById(customerId);
      const careerQuestion = customerData?.career_question;
      const initialPrompt =
        locale === "zh"
          ? `今年是2025年，请先理解我的问题，再回答我的问题：${careerQuestion}\n `
          : "It's 2025, please provide me with a comprehensive analysis including: 1. My overall personality traits and potential 2. My previous luck cycle, current luck cycle, and 2025 destiny trends 3. Recent career opportunities 4. Relationship analysis 5. Health concerns 6. Summary. I hope the analysis can be detailed and accurate.";

      const messages: CoreMessage[] = [
        {
          role: "user",
          content: initialPrompt,
        },
      ];

      const result = streamText({
        model: anthropic("claude-3-5-sonnet-20241022"),
        system: systemPrompt,
        messages,
        maxTokens: 8000,
        temperature: 0.7,
      });

      return result.toDataStreamResponse();
    } else {
      console.log("isInitializing:", isInitializing);

      // 构建消息历史，确保格式正确
      const messageHistory = [
        ...messages.map((m: Message) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      ];

      const result = streamText({
        model: deepseek("deepseek-chat"),
        system: systemPrompt,
        messages: messageHistory,
        maxTokens: 8000,
        temperature: 0.7,
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => `聊天服务出错: ${error}`,
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "聊天服务暂时不可用" }), {
      status: 500,
    });
  }
}
