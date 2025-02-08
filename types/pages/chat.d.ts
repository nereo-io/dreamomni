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
  loadingAnimation: {
    waitTime: string;
    pillars: {
      year: {
        name: string;
        desc: string;
      };
      month: {
        name: string;
        desc: string;
      };
      day: {
        name: string;
        desc: string;
      };
      hour: {
        name: string;
        desc: string;
      };
    };
    phrases: string[];
  };
} 