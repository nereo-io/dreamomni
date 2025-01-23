export interface ChatPage {
  title: string;
  loading: string;
  placeholder: string;
  send: string;
  systemMessages: {
    welcome: string;
    initialAnalysis: string;
    error: string;
  };
  footer: string;
  membership: {
    required: string;
    upgrade: string;
  };
} 