export interface ReaderPage {
  title: string;
  description: string;
  form: {
    gender: {
      label: string;
      male: string;
      female: string;
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
  };
  button: {
    submit: string;
    submitting: string;
    back: string;
  };
} 