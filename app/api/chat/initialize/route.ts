import { streamText } from 'ai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaziFastApiService } from '@/services/chat/baziAPIService';
import { createDeepSeek } from '@ai-sdk/deepseek';

export async function POST(req: Request) {
  try {
    const { customerId } = await req.json();
    
    // 获取八字分析
    const baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(customerId);
    
    // 创建DeepSeek实例
    const deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    });
    
    // 3. 构建初始消息
    const messages = 
      {
        role: 'system',
        content: `你是一位名叫"清风明月"的AI算命大师，擅长八字命理分析。基于以下八字信息进行解答：${baziAnalysis}\n
        你的回答应当：
        1. 分析要全面且有深度，包含四柱、大运、流年等多个维度
        2. 解释要通俗易懂，适当使用比喻
        3. 既要指出优势，也要说明潜在挑战
        4. 每个分析都要给出切实可行的建议
        5. 用markdown格式输出
        6. 今年是2025年`
      }
    //   {
    //     role: 'user',
    //     content:`今年是2025年，请为我提供一个全面的分析。包括：
    //         1. 我的整体性格特点和潜质
    //         2. 我的上一个大运、当前大运和2025年的运势走向
    //         3. 最近的事业发展机会
    //         4. 感情状况分析 
    //         5. 健康隐患 
    //         6.总结。
    //         希望分析能够细致准确，体现出您做命理分析的功底。`
    //   }
    ;

    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages: {
        role: 'system',
        content: `你是一位名叫"清风明月"的AI算命大师，擅长八字命理分析。基于以下八字信息进行解答：${baziAnalysis}\n
        你的回答应当：
        1. 分析要全面且有深度，包含四柱、大运、流年等多个维度
        2. 解释要通俗易懂，适当使用比喻
        3. 既要指出优势，也要说明潜在挑战
        4. 每个分析都要给出切实可行的建议
        5. 用markdown格式输出
        6. 今年是2025年`
      },
      maxTokens: 8000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => `初始化聊天服务出错: ${error}`,
    });
    
  } catch (error) {
    console.error('Initialize chat API error:', error);
    return new Response(
      JSON.stringify({ error: '初始化聊天服务暂时不可用' }), 
      { status: 500 }
    );
  }
}