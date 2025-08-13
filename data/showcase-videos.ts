export interface ShowcaseVideo {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  aspectRatio: "16:9" | "9:16" | "1:1";
  model: string;
  category: "featured" | "trending" | "new";
  tags?: string[];
}

export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: "showcase_1",
    title: "Orange Cat Cooking",
    prompt: "An orange cat wearing a chef's hat cooking in a modern kitchen with natural lighting",
    videoUrl: "https://example.com/videos/cat-cooking.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=225&fit=crop",
    duration: 5,
    aspectRatio: "16:9",
    model: "Seedance 1.0 Pro",
    category: "featured",
    tags: ["animals", "cooking", "cute"]
  },
  {
    id: "showcase_2",
    title: "Donut Creation",
    prompt: "A robotic arm decorating a donut with colorful frosting in slow motion",
    videoUrl: "https://example.com/videos/donut.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=225&fit=crop",
    duration: 7,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "trending",
    tags: ["food", "technology", "slow-motion"]
  },
  {
    id: "showcase_3",
    title: "Product Showcase",
    prompt: "The product in the 360-degree display picture is slowly moved forward to show the good quality of the product",
    videoUrl: "https://example.com/videos/product.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1609205807490-b95f8a82e1bb?w=400&h=225&fit=crop",
    duration: 8,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "featured",
    tags: ["product", "commercial", "360-degree"]
  },
  {
    id: "showcase_4",
    title: "Portrait Photography",
    prompt: "Professional portrait of a young woman with dramatic lighting and red clothing",
    videoUrl: "https://example.com/videos/portrait.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop",
    duration: 5,
    aspectRatio: "9:16",
    model: "Seedance 1.0 Pro",
    category: "new",
    tags: ["portrait", "fashion", "photography"]
  },
  {
    id: "showcase_5",
    title: "Anime Character",
    prompt: "Beautiful anime character with flowing hair and cherry blossoms in the background",
    videoUrl: "https://example.com/videos/anime.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400&h=225&fit=crop",
    duration: 6,
    aspectRatio: "1:1",
    model: "Veo3",
    category: "trending",
    tags: ["anime", "art", "character"]
  },
  {
    id: "showcase_6",
    title: "Nature Landscape",
    prompt: "Timelapse of a beautiful sunset over mountains with clouds moving across the sky",
    videoUrl: "https://example.com/videos/sunset.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop",
    duration: 10,
    aspectRatio: "16:9",
    model: "Seedance 1.0 Pro",
    category: "featured",
    tags: ["nature", "landscape", "timelapse"]
  }
];