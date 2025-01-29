// app/api/chat/route.ts
import { ChatService } from '@/services/chat/chatService';
import { ChatRequest } from '@/types/chat';
import { getChatSystemPrompt } from '@/i18n/prompts/chat';
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

const MODEL_CONFIG = {
  // model: 'deepseek-reasoner',
  model: 'deepseek-chat',
  maxTokens: 8000
} as const;

export async function POST(req: Request) {
  try {
    const { isInitializing, messages, customerId, locale } = await req.json() as ChatRequest;
    
    // console.log('=== Chat Request Debug ===');
    // console.log('Is Initializing:', isInitializing);
    // console.log('Customer ID:', customerId);
    // console.log('Locale:', locale);
    // console.log('Raw Messages:', JSON.stringify(messages, null, 2));

    // 获取八字分析
    const baziAnalysis = await ChatService.getBaziAnalysis(customerId);
    const systemPrompt = getChatSystemPrompt(locale, baziAnalysis);

    if (isInitializing) {
      const initialPrompt = await ChatService.buildInitialMessage(customerId, locale);
      const initialMessages = ChatService.buildMessageHistory(systemPrompt, [
        { role: 'user', content: initialPrompt }
      ]);

      // console.log('=== Initial Messages ===');
      // console.log(JSON.stringify(initialMessages, null, 2));

      try {
        return streamText({
          model: deepseek(MODEL_CONFIG.model),
          messages: initialMessages,
          maxTokens: MODEL_CONFIG.maxTokens
        }).toDataStreamResponse();
      } catch (error: any) {
        console.error("DeepSeek API error (initial):", error);
        return new Response(
          JSON.stringify({ 
            error: {
              message: "AI服务暂时不可用",
              code: 'AI_SERVICE_UNAVAILABLE',
              details: error?.message || '未知错误'
            }
          }), 
          { status: 500 }
        );
      }
    }

    const messageHistory = ChatService.buildMessageHistory(systemPrompt, messages);
    
    // console.log('=== Processed Messages ===');
    // console.log(JSON.stringify(messageHistory, null, 2));

    try {
      return streamText({
        model: deepseek(MODEL_CONFIG.model),
        messages: messageHistory,
        maxTokens: MODEL_CONFIG.maxTokens
      }).toDataStreamResponse();
    } catch (error: any) {
      console.error("DeepSeek API error (chat):", error);
      return new Response(
        JSON.stringify({ 
          error: {
            message: "AI服务暂时不可用",
            code: 'AI_SERVICE_UNAVAILABLE',
            details: error?.message || '未知错误',
            context: {
              model: MODEL_CONFIG.model,
              maxTokens: MODEL_CONFIG.maxTokens
            }
          }
        }), 
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ 
        error: {
          message: "聊天服务暂时不可用",
          code: 'CHAT_SERVICE_UNAVAILABLE',
          details: error?.message || '未知错误',
          timestamp: new Date().toISOString()
        }
      }), 
      { status: 500 }
    );
  }
}