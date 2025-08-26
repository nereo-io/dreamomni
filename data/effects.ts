export interface Effect {
  id: string;
  titleKey?: string;
  title?: string;
  image: string;
  video?: string;
  poster?: string;
  isHot?: boolean;
  category?: string;
}

export interface CategoryEffects {
  [categoryName: string]: Effect[];
}

export const categories = [
  "All",
  "Interaction",
  "Appearance",
  "Emotions",
  "Entertainment",
  "Hero/Villain",
  "Horror/Fantasy",
  "Xmas",
  "Others",
];

export const effects: Effect[] = [
  {
    id: "ai-kissing",
    titleKey: "ai-kissing",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-kissing.mp4",
    poster:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "kiss-me-ai",
    titleKey: "kiss-me-ai",
    image:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/kiss-me-ai.mp4",
    poster:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-twerk",
    titleKey: "ai-twerk",
    image:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-twerk.mp4",
    poster:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-hug",
    titleKey: "ai-hug",
    image:
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-hug.mp4",
    poster:
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-muscle",
    titleKey: "ai-muscle",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-muscle.mp4",
    poster:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-french-kissing",
    titleKey: "ai-french-kissing",
    image:
      "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-french-kissing.mp4",
    poster:
      "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-360-rotation",
    titleKey: "ai-360-rotation",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-360-rotation.mp4",
    poster:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    isHot: true,
  },
  {
    id: "ai-cloud-ride",
    titleKey: "ai-cloud-ride",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    video: "https://r2.veo3ai.io/effects/ai-cloud-ride.mp4",
    poster:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    isHot: true,
  },
];

export const categoryEffects: CategoryEffects = {
  "Fun and Creative Effects": [
    {
      id: "dance-party",
      titleKey: "dance-party",
      image:
        "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/dance-party.mp4",
      poster:
        "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&h=300&fit=crop",
    },
    {
      id: "magic-tricks",
      titleKey: "magic-tricks",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/magic-tricks.mp4",
      poster:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
    {
      id: "time-travel",
      titleKey: "time-travel",
      image:
        "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/time-travel.mp4",
      poster:
        "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop",
    },
  ],
  "Horror and Fantasy Effects": [
    {
      id: "vampire-transformation",
      titleKey: "vampire-transformation",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/vampire-transformation.mp4",
      poster:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    },
    {
      id: "ghost-effect",
      titleKey: "ghost-effect",
      image:
        "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/ghost-effect.mp4",
      poster:
        "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400&h=300&fit=crop",
    },
  ],
  "Appearance Changing Effects": [
    {
      id: "gender-swap",
      titleKey: "gender-swap",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/gender-swap.mp4",
      poster:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
    {
      id: "hair-color-change",
      titleKey: "hair-color-change",
      image:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/hair-color-change.mp4",
      poster:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    },
    {
      id: "makeup-artist",
      titleKey: "makeup-artist",
      image:
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/makeup-artist.mp4",
      poster:
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
    },
    {
      id: "body-transformation",
      titleKey: "body-transformation",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/body-transformation.mp4",
      poster:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    },
  ],
  "Seasonal Special Effects": [
    {
      id: "halloween-spooky",
      titleKey: "halloween-spooky",
      image:
        "https://images.unsplash.com/photo-1509557965043-36e4ff4a7b3d?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/halloween-spooky.mp4",
      poster:
        "https://images.unsplash.com/photo-1509557965043-36e4ff4a7b3d?w=400&h=300&fit=crop",
    },
    {
      id: "valentine-romance",
      titleKey: "valentine-romance",
      image:
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/valentine-romance.mp4",
      poster:
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=300&fit=crop",
    },
    {
      id: "new-year-celebration",
      titleKey: "new-year-celebration",
      image:
        "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/new-year-celebration.mp4",
      poster:
        "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=300&fit=crop",
    },
    {
      id: "summer-beach",
      titleKey: "summer-beach",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/summer-beach.mp4",
      poster:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    },
  ],
  "Emotional Expression Effects": [
    {
      id: "happiness-boost",
      titleKey: "happiness-boost",
      image:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/happiness-boost.mp4",
      poster:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=300&fit=crop",
    },
    {
      id: "surprise-reaction",
      titleKey: "surprise-reaction",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/surprise-reaction.mp4",
      poster:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
    {
      id: "anger-expression",
      titleKey: "anger-expression",
      image:
        "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/anger-expression.mp4",
      poster:
        "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=300&fit=crop",
    },
    {
      id: "love-struck",
      titleKey: "love-struck",
      image:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
      video: "https://r2.veo3ai.io/effects/love-struck.mp4",
      poster:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
    },
  ],
};
