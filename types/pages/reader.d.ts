export interface ReaderPage {
  title: string;
  description: string;
  loginPrompt: string;
  errors: {
    pleaseLogin: string;
    checkUsageError: string;
    noRemainingReadings: string;
    recordUsageError: string;
  };
  form: {
    birthDate: {
      label: string;
      info: string;
    };
    birthTime: {
      label: string;
      info: string;
    };
    gender: {
      label: string;
      info: string;
      male: string;
      female: string;
    };
  };
  button: {
    submit: string;
    submitting: string;
    back: string;
  };
  customer: {
    input: {
      unlimited_usage: string;
      remaining_readings: string;
    };
  };
} 