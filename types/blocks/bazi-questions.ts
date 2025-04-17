export interface BaziQuestion {
  id: string;
  text: string;
  category: string;
  tags: string[];
  copyCount: number;
}

export interface BaziQuestionCategory {
  id: string;
}

// 数据模型，只包含问题数据
export interface BaziQuestionsData {
  categories: BaziQuestionCategory[];
  questions: Record<string, BaziQuestion>;
}

// 国际化消息，包含UI展示文本
export interface BaziQuestionsMessages {
  title: string;
  description: string;
  copyHint: string;
  copiedToast: string;
  categories: Record<string, string>;
}
