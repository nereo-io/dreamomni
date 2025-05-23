import { CustomerInfo } from "./customer";
import { HexagramData, HexagramLine, HexagramResult } from "./hexagram";
export interface ChatRequest {
  isInitializing: boolean;
  messages: Message[];
  customer_info: CustomerInfo;
  locale: string;
  session_id: string;
  is_matching: boolean; // 是否是双人匹配模式
  partner_info?: CustomerInfo; // 伴侣信息ID
  is_iching?: boolean; // 是否是八卦占卜
  hexagramLines?: HexagramLine[]; // 八卦占卜的爻线
  hexagramData?: HexagramData; // 八卦占卜的结果
  model?: string; // 模型
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
export interface ChatSession {
  uuid: string;
  user_uuid: string;
  title: string;
  status: ChatStatus;
  created_at: Date;
  updated_at?: Date;
  model: string; // 模型
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
