import { ChatSession, ChatStatus, ChatMessage } from "@/types/chat";
import { toast } from "sonner";

export const chatSessionApi = {
  // 创建新的聊天会话
  async create(chatData: ChatSession) {
    try {
      const response = await fetch("/api/chat-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      });

      const data = await response.json();

      if (data.code === 0) {
        return data.data;
      } else {
        throw new Error(data.message || "创建聊天会话失败");
      }
    } catch (error) {
      console.error("创建聊天会话失败:", error);
      throw error;
    }
  },

  // 获取聊天会话
  async get(chatId: string) {
    try {
      const response = await fetch(`/api/chat-session/${chatId}`);
      const data = await response.json();

      if (data.code === 0) {
        return data.data;
      } else {
        throw new Error(data.message || "获取聊天会话失败");
      }
    } catch (error) {
      console.error("获取聊天会话失败:", error);
      throw error;
    }
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await fetch(`/api/chat-session/${chatId}/messages`);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    return response.json();
  },

  async saveMessage(
    chatId: string,
    message: ChatMessage
  ): Promise<ChatMessage> {
    const response = await fetch(`/api/chat-session/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error("Failed to save message");
    }
    return response.json();
  },

  async updateStatus(chatId: string, status: ChatStatus): Promise<ChatSession> {
    const response = await fetch(`/api/chat-session/${chatId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update chat status");
    }
    return response.json();
  },

  // 生成智能标题
  async generateTitle(chatId: string): Promise<{ title: string }> {
    const response = await fetch(`/api/chat-session/${chatId}/generate-title`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to generate title");
    }

    const data = await response.json();
    if (data.code === 0) {
      return data.data;
    } else {
      throw new Error(data.message || "生成标题失败");
    }
  },
};
