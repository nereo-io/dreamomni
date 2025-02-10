// app/api/chat/route.ts
import { ChatService } from "@/services/chat/chatService";
import { ChatRequest } from "@/types/chat";
import { getChatSystemPrompt } from "@/i18n/prompts/chat";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

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


const MODEL_CONFIG = {
  // model: 'deepseek-reasoner',
  model: "deepseek-chat",
} as const;

export async function POST(req: Request) {
  try {
    const { isInitializing, messages, customerId, locale } =
      (await req.json()) as ChatRequest;

    // 检查用户权限
    try {
      // 先检查会员状态
      const membershipResponse = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL}/api/membership/check`, {
        cache: 'no-store',
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
        credentials: 'include'
      });
      const membershipData = await membershipResponse.json();
      console.log('=== Membership Data ===');
      console.log(membershipData.data?.isMember);
      
      // 如果不是会员，则检查使用次数
      if (!membershipData.data?.isMember) {
        // 检查使用次数
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL}/api/readings/check`, {
          cache: 'no-store',
          headers: {
            cookie: req.headers.get('cookie') || '',
          },
          credentials: 'include'
        });
        const checkData = await checkResponse.json();
        
        if (checkData.code !== 0) {
          return new Response(JSON.stringify({
            error: {
              message: "检查使用次数失败",
              code: "CHECK_USAGE_ERROR"
            }
          }), { status: 403 });
        }

        if (!checkData.data.canRead) {
          return new Response(JSON.stringify({
            error: {
              message: "没有剩余使用次数",
              code: "NO_REMAINING_READINGS"
            }
          }), { status: 403 });
        }

        // 记录使用次数
        const createResponse = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL}/api/readings/create`, {
          method: "POST",
          headers: {
            cookie: req.headers.get('cookie') || '',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const createData = await createResponse.json();
        
        if (createData.code !== 0) {
          return new Response(JSON.stringify({
            error: {
              message: "记录使用次数失败",
              code: "RECORD_USAGE_ERROR"
            }
          }), { status: 403 });
        }
      }
    } catch (error) {
      console.error('Usage check error:', error);
      return new Response(JSON.stringify({
        error: {
          message: "系统错误",
          code: "SYSTEM_ERROR"
        }
      }), { status: 500 });
    }

    // console.log('=== Chat Request Debug ===');
    // console.log('Is Initializing:', isInitializing);
    // console.log('Customer ID:', customerId);
    // console.log('Locale:', locale);
    // console.log('Raw Messages:', JSON.stringify(messages, null, 2));

    // 获取八字分析
    const baziAnalysis = await ChatService.getBaziAnalysis(customerId);
    const systemPrompt = getChatSystemPrompt(locale, baziAnalysis);

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

      try {
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
      } catch (error: any) {
        console.error("DeepSeek API error (initial):", error);
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
    }

    const messageHistory = ChatService.buildMessageHistory(
      systemPrompt,
      messages
    );

    console.log('=== Processed Messages ===');
    console.log(JSON.stringify(messageHistory, null, 2));

    try {
      return streamText({
        // model: deepseek(MODEL_CONFIG.model),
        model: deepseekARK("ep-20250205155325-bsdb5"),  //r1
        // model: deepseekARK("ep-20250208110123-np259"),  // deepseek-qwen-32B
        // model: deepseekARK("ep-20250210120542-75dn2"), // deepseek-qwen-7B
        // model: deepseekALI('deepseek-r1'),
        messages: messageHistory,
        maxTokens: 8000,
      }).toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error: any) {
      console.error("DeepSeek API error (chat):", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "AI服务暂时不可用",
            code: "AI_SERVICE_UNAVAILABLE",
            details: error?.message || "未知错误",
            context: {
              model: MODEL_CONFIG.model,
              maxTokens: 8000,
            },
          },
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
          code: "CHAT_SERVICE_UNAVAILABLE",
          details: error?.message || "未知错误",
          timestamp: new Date().toISOString(),
        },
      }),
      { status: 500 }
    );
  }
}
