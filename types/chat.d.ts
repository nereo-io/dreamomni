// types/chat.d.ts
export interface ChatRequest {
  isInitializing: boolean;
  messages: Message[];
  customer_info: CustomerInfo;
  locale: string;
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
  New = "new",
  Pending = "pending",
  Created = "created",
  InProgress = "in_progress",
  Completed = "completed",
  Error = "error",
}

export interface Chat {
  uuid: string;
  title: string;
  status: ChatStatus;
  created_at: Date;
  customer_info: CustomerInfo;
}
