// services/chat/ChatService.ts
import { BaziFastApiService } from "./baziAPIService";
import { Message, ChatRequest } from "@/types/chat";
import { getCustomerInputById } from "@/models/customer";
import { getChatSystemPrompt } from "@/i18n/prompts/chat";
import { CoreMessage } from "ai";
import { CustomerInfo } from "@/types/customer";
export class ChatPromptService {
  private static chatSystemPromptCache = new Map<string, string>();

  static async buildSystemPrompt(
    customer_info: CustomerInfo,
    locale: string
  ): Promise<string> {
    if (!customer_info.id) {
      throw new Error("Customer ID is required");
    }

    if (this.chatSystemPromptCache.has(customer_info.id)) {
      return this.chatSystemPromptCache.get(customer_info.id) as string;
    }
    try {
      const baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(
        customer_info
      );
      const systemPrompt = getChatSystemPrompt(locale, baziAnalysis);
      this.chatSystemPromptCache.set(customer_info.id, systemPrompt);
      return systemPrompt;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  static buildMessageHistory(
    systemPrompt: string,
    messages: Message[]
  ): CoreMessage[] {
    return [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];
  }
}
