import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { QuestionSelectorSection } from "@/types/pages/career";

export interface ChineseZodiacPage {
  header?: Header;
  hero?: Hero;
  questionForm?: {
    questionSelector: QuestionSelectorSection;
  };
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
