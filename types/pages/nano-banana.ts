import { Section } from "@/types/blocks/section";

interface BannerSection {
  title: string;
  description: string;
  textToImageTab: string;
  imageToImageTab: string;
  promptPlaceholder: string;
  translatePromptLabel: string;
  createButtonText: string;
  generateWithAILabel: string;
  imageToImageTitle: string;
}

interface Partner {
  name: string;
  logo: string;
}

interface PartnersSection {
  items: Partner[];
}

interface Feature {
  title: string;
  description: string;
}

interface KeyFeaturesSection {
  features: Feature[];
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface UsageGuideSection {
  title: string;
  description: string;
  steps: Step[];
  buttonText: string;
}

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
  videos: VideoCard[];
  shareButtonText?: string;
  watchButtonText?: string;
}

interface RedditPostContent {
  author: string;
  timeAgo: string;
  title: string;
  imageUrl: string;
  upvotes: number;
  comments: number;
  link: string;
}

interface TwitterPostContent {
  author: string;
  timeAgo: string;
  title: string;
  imageUrl: string;
  likes: number;
  comments: number;
  retweets: number;
  link: string;
}

interface RedditPost {
  id?: string;
  width: string;
  height: string;
  src: string;
}

interface RedditCasesSection {
  title: string;
  posts: RedditPost[];
}

interface TwitterPost {
  id?: string;
  width: string;
  height: string;
  src: string;
}

interface TwitterCasesSection {
  title: string;
  posts: TwitterPost[];
}

export interface CtaSection {
  title: string;
  description?: string;
  buttonText: string;
}

export interface NanoBananaLandingPage {
  banner?: BannerSection;
  partners?: PartnersSection;
  keyFeatures?: KeyFeaturesSection;
  usageGuide?: UsageGuideSection;
  youtubeCases?: YoutubeCasesSection;
  redditCases?: RedditCasesSection;
  twitterCases?: TwitterCasesSection;
  faq?: Section;
  cta?: CtaSection;
}
