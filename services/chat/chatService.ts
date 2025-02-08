// services/chat/ChatService.ts
import { BaziFastApiService } from "./baziAPIService";
import { Message, ChatRequest } from "@/types/chat";
import { getCustomerById } from "@/models/customer";
import { getChatSystemPrompt } from "@/i18n/prompts/chat";
import { CoreMessage } from 'ai';

export class ChatService {
  private static baziAnalysisCache = new Map<string, string>();

  static async getBaziAnalysis(customerId: string): Promise<string> {
    if (!this.baziAnalysisCache.has(customerId)) {
      const analysis = await BaziFastApiService.getAnalysisForCustomer(customerId);
      this.baziAnalysisCache.set(customerId, analysis);
    }
    return this.baziAnalysisCache.get(customerId)!;
  }

  static async buildInitialMessage(customerId: string, locale: string): Promise<string> {
    const customerData = await getCustomerById(customerId);

    return `${customerData?.career_question}`;

    // return locale === 'zh'
    //   ? `今年是2025年，请先理解我的问题，再回答我的问题：${customerData?.career_question}\n`
    //   : `It's 2025, please understand and answer my question: ${customerData?.career_question}\n`;
  }

  static buildMessageHistory(systemPrompt: string, messages: Message[]): CoreMessage[] {
  
    return [
        { 
           role: 'system' as const, 
           content: systemPrompt 
        },
        ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
        }))
    ];
  }
}