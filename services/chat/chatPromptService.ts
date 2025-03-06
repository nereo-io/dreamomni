// services/chat/ChatService.ts
import { BaziFastApiService } from "./baziAPIService";
import { Message, ChatRequest } from "@/types/chat";
import { getCustomerInputById } from "@/models/customer";
import {
  getChatSystemPrompt,
  getChatMatchingSystemPrompt,
} from "@/i18n/prompts/chat";
import { CoreMessage } from "ai";
import { CustomerInfo } from "@/types/customer";
export class ChatPromptService {
  private static chatSystemPromptCache = new Map<string, string>();

  static async buildSystemPrompt(
    session_id: string,
    customer_info: CustomerInfo,
    locale: string
  ): Promise<string> {
    if (!customer_info.id) {
      throw new Error("Customer ID is required");
    }

    if (ChatPromptService.chatSystemPromptCache.has(session_id)) {
      return ChatPromptService.chatSystemPromptCache.get(session_id) as string;
    }
    try {
      const baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(
        customer_info
      );
      const systemPrompt = getChatSystemPrompt(
        locale,
        customer_info,
        baziAnalysis
      );
      ChatPromptService.chatSystemPromptCache.set(session_id, systemPrompt);
      return systemPrompt;
    } catch (error) {
      console.error(error);
      return "";
    }
  }
  static async buildMatchingSystemPrompt(
    session_id: string,
    customer_info: CustomerInfo,
    partner_info: CustomerInfo,
    locale: string
  ): Promise<string> {
    if (!customer_info.id) {
      throw new Error("Customer ID is required");
    }

    if (ChatPromptService.chatSystemPromptCache.has(session_id)) {
      return ChatPromptService.chatSystemPromptCache.get(session_id) as string;
    }
    try {
      const customerBaziAnalysis =
        await BaziFastApiService.getAnalysisForCustomer(customer_info);
      const partnerBaziAnalysis =
        await BaziFastApiService.getAnalysisForCustomer(partner_info);
      const systemPrompt = getChatMatchingSystemPrompt(
        locale,
        customer_info,
        partner_info,
        customerBaziAnalysis,
        partnerBaziAnalysis
      );
      ChatPromptService.chatSystemPromptCache.set(session_id, systemPrompt);
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
