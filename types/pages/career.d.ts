import { Section } from "../blocks/section";
import { QuestionSuggestions } from "../blocks/question-suggestions";
import { Hero } from "../blocks/hero";
import { Section } from "@/types/blocks/section";
import { QuestionListHeader } from "../blocks/base";

export interface CareerPage {
  hero?: Hero;
  questionSuggestions?: QuestionSuggestions;
  introduce?: Section;
  questionListHeader?: QuestionListHeader;
  faq?: Section;
  cta?: Section;
}
