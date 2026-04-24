/**
 * Model Landing Pages Configuration
 *
 * This file defines all models that have dedicated landing pages.
 * Each model slug must have corresponding:
 * 1. JSON data files in i18n/pages/<slug>/<locale>.json
 * 2. SEO metadata in i18n/messages/<locale>.json under <slug_key>
 */

export const MODEL_LANDING_PAGES = [
  'nano-banana',
  'nano-banana-pro',
  'wan-2-5',
  'seedance-1-5',
  'seedance-2-0',
  'hailuo-2-3',
  'kling-3-0',
  'kling-3-motion-control',
  'veo-3-1',
  'veo-3-1-lite',
  'sora-2',
  'sora-alternative',
  'seedream-4-5',
  'seedream-5-0',
  'gpt-image-2',
] as const;

export type ModelSlug = typeof MODEL_LANDING_PAGES[number];

/**
 * Check if a given slug is a valid model landing page
 */
export function isValidModelSlug(slug: string): slug is ModelSlug {
  return MODEL_LANDING_PAGES.includes(slug as ModelSlug);
}
