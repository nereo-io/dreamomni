/**
 * Image Effect Pages Configuration
 *
 * Each slug must have corresponding:
 * 1. JSON data files in i18n/pages/image-effect/<slug>/<locale>.json
 */
export const IMAGE_EFFECT_PAGES = ["ghibli-style", "gallop-into-2026"] as const;

export type ImageEffectSlug = (typeof IMAGE_EFFECT_PAGES)[number];

export function isValidImageEffectSlug(
  slug: string,
): slug is ImageEffectSlug {
  return IMAGE_EFFECT_PAGES.includes(slug as ImageEffectSlug);
}
