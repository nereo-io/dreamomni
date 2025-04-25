export interface QuestionExample {
  text: string;
  label: string;
  type: "single" | "double";
}

export interface QuestionExamples {
  title: string;
  examples: QuestionExample[];
}
