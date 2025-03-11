export interface SuggestedQuestion {
  id?: string;
  text: string;
  category: string;
  reading_type: "single" | "double";
}

export interface QuestionSuggestions {
  categories: {
    [key: string]: string; // key 是分类ID (all, career, future 等)
  };
  questions: {
    [key: string]: SuggestedQuestion;
  };
}
