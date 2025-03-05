import { CustomerInfo } from "./customer";

export interface ChatRequest {
  isInitializing: boolean;
  messages: Message[];
  customer_info: CustomerInfo;
  locale: string;
  session_id: string;
  is_matching: boolean; // 是否是双人匹配模式
  partner_info?: CustomerInfo; // 伴侣信息ID
}

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: MessageRole;
  content: string;
  reasoning_content?: string;
}

export interface ChatResponse {
  error?: {
    message: string;
    code: string;
  };
}

export enum ChatStatus {
  New = "new", // context中的新会话
  Creating = "creating", // 正在保存到数据库
  Created = "created", // 已保存且正在使用
  Completed = "completed", // 对话已完成
  Error = "error", // 发生错误
}

// 数据库表对应的类型
export interface ChatSessionDB {
  uuid: string;
  user_uuid: string;
  title: string;
  status: ChatStatus;
  customer_info_id: string;
  created_at: Date;
  updated_at?: Date;
  is_matching: boolean; // 是否是双人匹配模式
  partner_info_id?: string; // 伴侣信息ID
}

// 消息类型保持不变
export interface ChatMessage {
  id?: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  reasoning_content?: string;
  created_at?: Date;
}

// 前端使用的完整类型
export interface ChatSession extends ChatSessionDB {
  customer_info: CustomerInfo; // 前端始终需要完整的客户信息
  partner_info?: CustomerInfo; // 伴侣信息，用于双人匹配
}
