/**
 * Video Effect Pages Configuration
 *
 * Each slug must have corresponding:
 * 1. JSON data files in i18n/pages/video-effect/<slug>/<locale>.json
 */
export const VIDEO_EFFECT_PAGES = [
  "ai-kissing",
  "image-transition",
  "my-girlfriendssss",
  "paw-princess",
  "muscle-max-bodybuilder-champion",
  "kitten-hide-and-seek",
  "360-microwave",
  "ride-my-porsche",
  "petals-of-goodbye",
  "liquid-metal",
  "hi-five-emoji-twin",
  "boom-drop",
  "2025-oscar-winner",
  "kiss-me-ai",
  "muscle-surge",
  "thunder-god",
  "ninja-shadow-clone",
  "my-boyfriendsssss",
  "eye-zoom-challenge",
  "officer-crush",
  "fairy-wings",
  "money-tornado",
  "middle-finger-up",
  "earth-zoom-challenge",
  "kiss-kiss",
  "birthday-surprise",
  "private-airplane",
  "fire-roar",
  "ghibli-magic",
  "dust-me-away",
  "buddha-s-blessing",
] as const;

export type VideoEffectSlug = (typeof VIDEO_EFFECT_PAGES)[number];

export function isValidVideoEffectSlug(
  slug: string,
): slug is VideoEffectSlug {
  return VIDEO_EFFECT_PAGES.includes(slug as VideoEffectSlug);
}
