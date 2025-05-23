export interface QuestionSelector {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  loginPrompt: string;
  errors: {
    pleaseLogin: string;
    checkUsageError: string;
    noRemainingReadings: string;
    recordUsageError: string;
  };
  customer: {
    input: {
      unlimited_usage: string;
      remaining_readings: string;
    };
  };
}
