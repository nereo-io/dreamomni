import { Section } from "../blocks/section";
import { QuestionSuggestions } from "../blocks/question-suggestions";
import { Hero } from "../blocks/hero";
import { QuestionListHeader } from "../blocks/base";
import { FAQ } from "../blocks/faq";
import { CTA } from "../blocks/cta";

export interface CareerPage {
  hero?: Hero;
  questionSuggestions?: QuestionSuggestions;
  questionListHeader?: QuestionListHeader;
  faq?: FAQ;
  cta?: CTA;
}
