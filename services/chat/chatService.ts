import {
  ChatSession,
  ChatStatus,
  ChatMessage,
  ChatSessionDB,
} from "@/types/chat.d";
import {
  createChatSession,
  getChatSessionByUuid,
  getChatSessionsByUserId,
  createOrUpdateChatMessage,
  getChatMessagesByChatSessionId,
  updateChatSessionStatus,
  deleteChatSessionByUuid,
} from "@/models/chat";
import { getCustomerInfoById } from "@/models/customer";

export const ChatService = {
  async createChatSession(chat: ChatSessionDB): Promise<ChatSession> {
    try {
      // 保存会话基本信息
      const savedSession = await createChatSession(chat);
      const customerInfo = await getCustomerInfoById(
        savedSession.customer_info_id
      );
      const partnerInfo = await getCustomerInfoById(
        savedSession.partner_info_id || ""
      );
      // 组装完整的会话信息
      return {
        ...savedSession,
        customer_info: customerInfo,
        partner_info: partnerInfo,
      };
    } catch (error) {
      console.error("Failed to create chat session:", error);
      throw error;
    }
  },

  async getChatSession(uuid: string): Promise<ChatSession | null> {
    try {
      console.log("uuid", uuid);
      const session = await getChatSessionByUuid(uuid);
      if (!session) return null;
      console.log("session", session);

      // 获取客户信息
      const customerInfo = await getCustomerInfoById(session.customer_info_id);
      let partnerInfo = undefined;
      if (session.is_matching === true && session.partner_info_id) {
        partnerInfo = await getCustomerInfoById(session.partner_info_id);
      }

      // 组装完整的会话信息
      return {
        ...session,
        customer_info: customerInfo,
        partner_info: partnerInfo,
      };
    } catch (error) {
      console.error("Failed to get chat session:", error);
      throw error;
    }
  },

  async getChatSessionsByUserId(userId: string): Promise<ChatSessionDB[]> {
    try {
      const sessions = await getChatSessionsByUserId(userId);
      return sessions;
    } catch (error) {
      console.error("Failed to get chat sessions by user id:", error);
      throw error;
    }
  },

  async deleteChatSession(uuid: string): Promise<void> {
    try {
      await deleteChatSessionByUuid(uuid);
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      throw error;
    }
  },
  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    try {
      return await createOrUpdateChatMessage(message);
    } catch (error) {
      console.error("Failed to save chat message:", error);
      throw error;
    }
  },

  async updateChatStatus(
    uuid: string,
    status: ChatStatus
  ): Promise<ChatSessionDB | null> {
    try {
      // 先获取现有会话
      const session = await getChatSessionByUuid(uuid);
      if (!session) return null;

      // 更新状态
      const updatedSession = await updateChatSessionStatus(uuid, status);
      if (!updatedSession) return null;

      // 返回完整的会话信息
      return updatedSession;
    } catch (error) {
      console.error("Failed to update chat status:", error);
      throw error;
    }
  },
};
