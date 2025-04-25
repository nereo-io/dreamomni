import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { SolveAllQuestionsSection } from "@/types/blocks/slove-all-questions";
import { QuestionSuggestions } from "@/types/blocks/question-suggestions";
import { QuestionExamples } from "@/types/blocks/question-examples";

export interface LandingPage {
  header?: Header;
  hero?: Hero;
  questionSuggestions?: QuestionSuggestions;
  questionExamples?: QuestionExamples;
  solveAllQuestions?: SolveAllQuestionsSection;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  feature?: Section;
  showcase?: Section;
  stats?: Section;
  pricing?: Pricing;
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
  footer?: Footer;
}
