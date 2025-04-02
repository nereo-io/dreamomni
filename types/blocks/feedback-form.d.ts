export interface FeedbackFormData {
  feedbackType: string;
  content: string;
}

export interface FeedbackFormProps {
  title?: string;
  onSubmitSuccess?: () => void;
  urgentEmail?: string;
  urgentContactTitle?: string;
  urgentContactDescription?: string;
  submitButtonText?: string;
  submittingButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface FeedbackTypeOption {
  value: string;
  label: string;
}

export interface FeedbackFormTranslations {
  title: string;
  feedbackType: {
    label: string;
    placeholder: string;
    options: FeedbackTypeOption[];
  };
  content: {
    label: string;
    placeholder: string;
  };
  submitButton: string;
  submittingButton: string;
  urgentContact: {
    title: string;
    description: string;
    copyButton: string;
  };
  messages: {
    success: string;
    error: string;
    emailCopied: string;
    loginRequired?: string;
  };
  validation?: {
    feedbackTypeRequired: string;
    contentRequired: string;
  };
}
