import { existsSync } from 'fs';
import { join } from 'path';
import { isValidModelSlug, MODEL_LANDING_PAGES } from '../model-landing-pages';

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
});
