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
  credits: {
    remaining: string;
    upgrade: string;
    member: string;
  };
  errors: {
    checkUsageError: string;
    noRemainingReadings: string;
    recordUsageError: string;
    generalError: string;
    pleaseLogin: string;
    failedToLoadChat: string;
  };
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
  library: {
    title: string;
    loading: string;
    loadFailed: string;
    noHistory: string;
    deleteSuccess: string;
    deleteFailed: string;
    fetchFailed: string;
  };
}
