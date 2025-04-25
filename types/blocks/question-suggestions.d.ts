export interface SuggestedQuestion {
  id?: string;
  text: string;
  category: string;
  reading_type: "single" | "double";
  priority?: number;
  tag?: string; // 新增tag字段，用于标记问题，如"new"等
}

export interface QuestionSuggestions {
  disabled?: boolean;
  categories: {
    [key: string]: string; // key 是分类ID (all, career, future 等)
  };
  questions: {
    [key: string]: SuggestedQuestion;
  };
}
