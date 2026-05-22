import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('home header affiliate button', () => {
  it('renders the affiliate program entry in the home header', () => {
    const headerSource = readFileSync(
      path.join(process.cwd(), 'components/blocks/home-layout/header.tsx'),
      'utf-8'
    );
    const buttonSource = readFileSync(
      path.join(
        process.cwd(),
        'components/blocks/home-layout/affiliate-button.tsx'
      ),
      'utf-8'
    );

    expect(headerSource).toContain(
      '@/components/blocks/home-layout/affiliate-button'
    );
    expect(headerSource).toContain('<AffiliateButton />');
    expect(buttonSource).toContain('href="/affiliate"');
    expect(buttonSource).toContain('target="_blank"');
    expect(buttonSource).toContain('t("affiliate")');
    expect(buttonSource).toContain('t("affiliate_badge")');
  });

  it('ships affiliate button copy for every supported message locale', () => {
    const locales = [
      'de',
      'en',
      'es',
      'fr',
      'it',
      'ja',
      'ko',
      'pt',
      'ru',
      'zh',
    ];

    for (const locale of locales) {
      const messages = JSON.parse(
        readFileSync(
          path.join(process.cwd(), `i18n/messages/${locale}.json`),
          'utf-8'
        )
      );

      expect(messages.header.affiliate).toBeTruthy();
      expect(messages.header.affiliate_badge).toContain('30');
    }
  });
});
