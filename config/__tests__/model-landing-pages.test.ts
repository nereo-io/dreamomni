import { existsSync } from 'fs';
import { join } from 'path';
import {
  INDEXABLE_MODEL_LANDING_PAGES,
  isIndexableModelSlug,
  isValidModelSlug,
  MODEL_LANDING_PAGES,
} from '../model-landing-pages';

const geminiOmniIntentSlugs = [
  'gemini-omni-api',
  'gemini-omni-pricing',
  'gemini-omni-free',
  'gemini-omni-alternatives-vs-veo-3-1',
];

describe('model landing page registry', () => {
  it('registers GPT Image 2 with English landing content', () => {
    expect(MODEL_LANDING_PAGES).toContain('gpt-image-2');
    expect(isValidModelSlug('gpt-image-2')).toBe(true);
    expect(
      existsSync(
        join(
          process.cwd(),
          'i18n/pages/model-landing/gpt-image-2/en.json'
        )
      )
    ).toBe(true);
  });

  it('registers Gemini Omni intent pages as indexable landing pages', () => {
    for (const slug of geminiOmniIntentSlugs) {
      expect(MODEL_LANDING_PAGES).toContain(slug);
      expect(INDEXABLE_MODEL_LANDING_PAGES).toContain(slug);
      expect(isValidModelSlug(slug)).toBe(true);
      expect(isIndexableModelSlug(slug)).toBe(true);
      expect(
        existsSync(
          join(process.cwd(), `i18n/pages/model-landing/${slug}/en.json`)
        )
      ).toBe(true);
    }
  });
});
