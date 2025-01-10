export interface ReaderPage {
  title: string;
  description: string;
  form: {
    name: {
      label: string;
      placeholder: string;
    };
    gender: {
      label: string;
      male: string;
      female: string;
    };
    birthDate: {
      label: string;
    };
    birthTime: {
      label: string;
    };
  };
  button: {
    submit: string;
    submitting: string;
    back: string;
  };
} 