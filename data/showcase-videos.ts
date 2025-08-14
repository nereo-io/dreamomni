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
    id: "anime-girl",
    title: "Anime Girl with Braids",
    prompt: "The little girl keeps smiling at the camera and pokes the lens with her finger.",
    videoUrl: "https://r2.veo3ai.io/intro/image-to-video/Anime-Girl-Pokes-Camera.mp4",
    thumbnailUrl: "https://r2.veo3ai.io/intro/image-to-video/img/Anime-Girl-with-Braids.png",
    duration: 5,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "featured",
    tags: ["anime", "character", "portrait"]
  },
  {
    id: "t-rex",
    title: "Tyrannosaurus Rex",
    prompt: "The T-Rex's head pokes out of the camera.",
    videoUrl: "https://r2.veo3ai.io/intro/image-to-video/TRex-Peeks-at-Camera.mp4",
    thumbnailUrl: "https://r2.veo3ai.io/intro/image-to-video/img/Tyrannosaurus-Rex-in-Wilderness.png",
    duration: 5,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "trending",
    tags: ["dinosaur", "prehistoric", "wildlife"]
  },
  {
    id: "mother-son",
    title: "Mother and Son Walking",
    prompt: "A mother walks happily holding her child's hand.",
    videoUrl: "https://r2.veo3ai.io/intro/image-to-video/Mother-Son-Walking-in-Park.mp4",
    thumbnailUrl: "https://r2.veo3ai.io/intro/image-to-video/img/Mother-and-Son-Walking-in-Park.png",
    duration: 5,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "featured",
    tags: ["family", "walking", "happiness"]
  },
  {
    id: "motorcycle",
    title: "Motorcycle Speed Trail",
    prompt: "The motorcycle is speeding, and the tail light turns into a line.",
    videoUrl: "https://r2.veo3ai.io/intro/image-to-video/Motorcycle-Speeds-with-Light-Trail.mp4",
    thumbnailUrl: "https://r2.veo3ai.io/intro/image-to-video/img/Astronaut-Looking-at-Earth.png",
    duration: 5,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "new",
    tags: ["motorcycle", "speed", "light-trail"]
  },
  {
    id: "t-rex-1",
    title: "Tyrannosaurus Rex",
    prompt: "The T-Rex's head pokes out of the camera.",
    videoUrl: "https://r2.veo3ai.io/intro/image-to-video/TRex-Peeks-at-Camera.mp4",
    thumbnailUrl: "https://r2.veo3ai.io/intro/image-to-video/img/Tyrannosaurus-Rex-in-Wilderness.png",
    duration: 5,
    aspectRatio: "16:9",
    model: "Veo3",
    category: "trending",
    tags: ["dinosaur", "prehistoric", "wildlife"]
  },
];