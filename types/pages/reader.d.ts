export interface ReaderPage {
  title: string;
  description: string;
  loginPrompt: string;
  errors: {
    pleaseLogin: string;
    checkUsageError: string;
    noRemainingReadings: string;
    recordUsageError: string;
    operationFailed: string;
  };
  form: {
    optional: string;
    name: {
      label: string;
      placeholder: string;
      info: string;
    };
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
    relationshipStatus: {
      label: string;
      placeholder: string;
      options: {
        single: string;
        dating: string;
        engaged: string;
        married: string;
        divorced: string;
        widowed: string;
        complicated: string;
      };
      info: string;
    };
    jobStatus: {
      label: string;
      placeholder: string;
      options: {
        student: string;
        employed: string;
        selfEmployed: string;
        unemployed: string;
        retired: string;
        homemaker: string;
      };
      info: string;
    };
    additionalInfo: {
      label: string;
      placeholder: string;
      info: string;
    };
  };
  button: {
    submit: string;
    submitting: string;
    back: string;
    saveSuccess: string;
  };
}
