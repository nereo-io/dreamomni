export interface ReaderPage {
  title: string;
  description: string;
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
}
