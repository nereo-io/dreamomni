export interface ImageToVideoExample {
  id: string;
  originalImage: string;
  videoImage: string;
  originalAlt: string;
  videoAlt: string;
  prompt: string;
}

export interface ImageToVideoShowcase {
  title: string;
  description: string;
  labels: {
    originalImage: string;
    prompt: string;
    video: string;
  };
  examples: ImageToVideoExample[];
}
