import { Section } from "../blocks/section";

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface QuestionSelectorSection {
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
    pleaseInputBirthInfo: string;
  };
  customer: {
    input: {
      unlimited_usage: string;
      remaining_readings: string;
      add_birth_info: string;
      partner_birth_info?: string;
    };
  };
  categories: {
    [key: string]: string; // key 是分类ID (all, career, future 等)
  };
  questions: {
    [key: string]: string; // key 是问题ID (career1, future1 等)
  };
  matching?: {
    single: string;
    double: string;
    double_title: string;
    description: string;
    placeholder?: string;
  };
}

export interface CareerPage {
  valueProps?: Section;
  howItWorks?: Section;
  questionSelector: QuestionSelectorSection;
}
