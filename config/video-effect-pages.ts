/**
 * Video Effect Pages Configuration
 *
 * Each slug must have corresponding:
 * 1. JSON data files in i18n/pages/video-effect/<slug>/<locale>.json
 */
export const VIDEO_EFFECT_PAGES = ["ai-kissing", "image-transition"] as const;

export type VideoEffectSlug = (typeof VIDEO_EFFECT_PAGES)[number];

export function isValidVideoEffectSlug(
  slug: string,
): slug is VideoEffectSlug {
  return VIDEO_EFFECT_PAGES.includes(slug as VideoEffectSlug);
}
