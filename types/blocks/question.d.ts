import type { NavItem } from "@/types/blocks/base";

export interface QuestionItem {
  uuid?: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  reading_type: string;
  locale: string;
  rating?: number;
  votes?: number;
  author_name?: string;
  author_avatar_url?: string;
  reading_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RelatedQuestion {
  slug: string;
  title: string;
  rating: number;
  votes: number;
}

export interface QuestionDetail extends QuestionItem {
  breadcrumbItems: NavItem[];
  relatedQuestions?: RelatedQuestion[];
}

export interface QuestionList {
  items: QuestionItem[];
}
