import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaziFastApiService } from '@/services/chat/baziAPIService';

export async function POST(req: Request) {
  try {
    const { customerId, locale } = await req.json();
    
    // 1. 获取八字分析
    const baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(customerId);
    
    // 2. 配置 LLM
    const llm = new ChatOpenAI({
      modelName: 'deepseek-chat',
      streaming: true,
      temperature: 0.7,
      maxTokens: 8000,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
      }
    });

    const parser = new StringOutputParser();
    
    // 3. 根据语言构建系统提示词
    const systemPrompt = locale === 'zh' 
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

    const initialPrompt = locale === 'zh'
      ? "今年是2025年，请为我提供一个全面的分析。包括：1. 我的整体性格特点和潜质2. 我的上一个大运、当前大运和2025年的运势走向3. 最近的事业发展机会4. 感情状况分析 5. 健康隐患 6.总结。希望分析能够细致准确，体现出您做命理分析的功底。"
      : "It's 2025, please provide me with a comprehensive analysis including: 1. My overall personality traits and potential 2. My previous luck cycle, current luck cycle, and 2025 destiny trends 3. Recent career opportunities 4. Relationship analysis 5. Health concerns 6. Summary. I hope the analysis can be detailed and accurate.";

    const systemMessage = new SystemMessage(systemPrompt);
    const initialMessage = new HumanMessage(initialPrompt);

    // 4. 创建流式响应
    const stream = await llm.pipe(parser).stream([systemMessage, initialMessage]);

    // 5. 创建并返回自定义流式响应
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const encoded = encoder.encode(chunk);
            controller.enqueue(encoded);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Initialize chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initialize chat'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}