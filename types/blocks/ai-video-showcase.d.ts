export interface VideoExample {
  id: string;
  image: string; // This can be a video URL
  alt: string;
  prompt: string;
  isNew?: boolean;
}

export interface AIVideoShowcase {
  title?: string;
  description?: string;
  cta?: string;
  examples: VideoExample[];
}