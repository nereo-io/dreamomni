import {
  getChatSessionsByUserId as getChatSessionsByUserIdModel,
  getChatSessionByUuid,
  updateChatSessionStatus,
  createChatSession,
  createOrUpdateChatMessage,
  getChatMessagesByChatSessionId,
  deleteChatSessionByUuid,
} from "@/models/chat";
import { ChatSession, ChatStatus, ChatMessage } from "@/types/chat.d";
import { getCustomerInfoById } from "@/models/customer";

export class ChatService {
  /**
   * 根据会话UUID获取完整的聊天会话信息（包括关联的客户信息）
   */
  async getChatSessionWithDetails(sessionUuid: string) {
    try {
      // 获取基础会话信息
      const session = await getChatSessionByUuid(sessionUuid);
      if (!session) {
        throw new Error("会话不存在");
      }

      // 初始化返回对象
      let result: {
        session: ChatSession;
        customerInfo?: any;
        partnerInfo?: any;
      } = {
        session,
      };

      // 注意：移除了对customer_info_id和partner_info_id的处理
      // 因为这些字段在简化的ChatSession中不存在

      return result;
    } catch (error) {
      console.error("获取聊天会话详情失败:", error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取用户的所有聊天会话
   */
  async getChatSessionsByUserId(userId: string): Promise<ChatSession[]> {
    try {
      const sessions = await getChatSessionsByUserIdModel(userId);
      return sessions || [];
    } catch (error) {
      console.error("获取用户聊天会话列表失败:", error);
      throw error;
    }
  }

  /**
   * 更新会话状态
   */
  async updateChatSessionStatus(
    sessionUuid: string,
    status: ChatStatus
  ): Promise<ChatSession | null> {
    try {
      return await updateChatSessionStatus(sessionUuid, status);
    } catch (error) {
      console.error("更新会话状态失败:", error);
      throw error;
    }
  }

  async deleteChatSession(uuid: string): Promise<void> {
    try {
      await deleteChatSessionByUuid(uuid);
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      throw error;
    }
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    try {
      return await createOrUpdateChatMessage(message);
    } catch (error) {
      console.error("Failed to save message:", error);
      throw error;
    }
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const result = await getChatMessagesByChatSessionId(sessionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    } catch (error) {
      console.error("Failed to get messages:", error);
      throw error;
    }
  }
}
