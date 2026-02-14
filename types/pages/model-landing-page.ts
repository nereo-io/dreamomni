import { Section } from "@/types/blocks/section";

// ModelBanner
export interface Tab {
  type: "text" | "image";
  title: string;
  subTitle: string;
  value: string;
  placeholder: string;
  buttonText: string;
  modelName: string;
  modelLogo: string;
  tips?: string;
}

export interface BannerSection {
  title: string;
  description: string;
  tabs: Tab[];
}

// PartnersScroll
export interface Partner {
  name: string;
  logo: string;
}

// ModelKeyFeatures
export interface FeatureItem {
  title: string;
  description: string;
}

export interface TableCell {
  type: "text" | "image" | "video" | "compareImage";
  content: string;
  altText?: string; // 仅图片类型需要
  poster?: string; // 视频封面图URL，可选
  overlayContent?: string; // compareImage类型的叠加图片URL
}

export interface TableHeader {
  title: string;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableData {
  headers: TableHeader[];
  rows: TableRow[];
}

export interface DetailItem {
  title: string;
  description: string;
  type: "table" | "video";
  data: TableData | string;
  poster?: string; // 视频封面图URL，可选
}

export interface KeyFeaturesSection {
  title?: string;
  // features?: FeatureItem[];
  details?: DetailItem[];
}

export interface ModelKeyFeaturesProps {
  section: Partial<KeyFeaturesSection>;
}

export interface DynamicTableProps {
  tableData: TableData;
}

// ModelUsageGuide
export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface UsageGuideSection {
  title: string;
  description: string;
  steps: Step[];
  buttonText: string;
}

export interface ModelUsageGuideProps {
  section: UsageGuideSection;
}

// YoutubeCaseShow
export interface VideoCard {
  youtubeLink: string;
  width: string;
  height: string;
  id?: string;
  name?: string;
  thumbnailUrl?: string;
  title?: string;
}

export interface YoutubeCasesSection {
  title: string;
  content: VideoCard[];
  shareButtonText?: string;
  watchButtonText?: string;
}

export interface YouTubeCaseShowProps {
  section: YoutubeCasesSection;
}

// RedditCaseShow
export interface RedditPost {
  id?: string;
  width: string;
  height: string;
  src: string;
}

export interface RedditCasesSection {
  title: string;
  content: RedditPost[];
}

export interface RedditCaseShowProps {
  section: RedditCasesSection;
}

// TwitterCaseShow
export interface TwitterPost {
  id?: string;
  width: string;
  height: string;
  src: string;
}

export interface TwitterCasesSection {
  title: string;
  content: TwitterPost[];
}

export interface TwitterCaseShowProps {
  section: TwitterCasesSection;
}

// ModelCta
export interface CtaSection {
  title: string;
  description?: string;
  buttonText: string;
}

export interface ModelCtaProps {
  section: CtaSection;
}

export interface ModelLandingPage {
  banner?: BannerSection;
  partners?: Partner[];
  features?: KeyFeaturesSection;
  usageGuide?: UsageGuideSection;
  youtubeCases?: YoutubeCasesSection;
  redditCases?: RedditCasesSection;
  twitterCases?: TwitterCasesSection;
  faq?: Section;
  cta?: CtaSection;
}
