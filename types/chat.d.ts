// types/chat.d.ts
export interface ChatRequest {
    isInitializing: boolean;
    messages: Message[];
    customerId: string;
    locale: string;
  }
  
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';


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