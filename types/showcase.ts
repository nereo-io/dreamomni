export interface ShowcaseVideo {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  imageUrl?: string; // Optional: source image URL for image-to-video
  duration: number; // in seconds
  aspectRatio: "16:9" | "9:16" | "1:1" | "Auto";
  model: string;
  category: "featured" | "trending" | "new";
  tags?: string[];
}