import { streamText } from 'ai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaziFastApiService } from '@/services/chat/baziAPIService';
import { createDeepSeek } from '@ai-sdk/deepseek';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 缓存 baziAnalysis 结果
const baziAnalysisCache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const { messages, customerId } = await req.json();
    
    let baziAnalysis;
    
    // 只在首次请求或缓存未命中时获取八字分析
    if (!baziAnalysisCache.has(customerId)) {
      baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(customerId);
      baziAnalysisCache.set(customerId, baziAnalysis);
    } else {
      baziAnalysis = baziAnalysisCache.get(customerId);
    }

    // 创建DeepSeek实例
    const deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    });

    // 构建消息历史，确保格式正确
    const messageHistory = [
      {
        role: 'system',
        content: `你是一位名叫"清风明月"的AI算命大师，擅长八字命理分析。基于以下八字信息进行解答：${baziAnalysis}\n
        你的回答应当：
        1. 解释要通俗易懂，适当使用比喻
        2. 既要指出优势，也要说明潜在挑战
        3. 每个分析都要给出切实可行的建议
        4. 用markdown格式输出
        5. 今年是2025年`
      },
      ...messages.map((m: Message) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages: messageHistory,
      maxTokens: 8000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => `聊天服务出错: ${error}`,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: '聊天服务暂时不可用' }), 
      { status: 500 }
    );
  }
}
