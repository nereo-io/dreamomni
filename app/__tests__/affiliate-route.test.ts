import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import { getPostsByLocale } from '@/models/post';

jest.mock('@/models/post', () => ({
  getPostsByLocale: jest.fn(),
}));

const mockGetPostsByLocale = jest.mocked(getPostsByLocale);

describe('affiliate route', () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_WEB_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_WEB_URL = 'https://example.com';
    mockGetPostsByLocale.mockResolvedValue([]);
  });

  afterAll(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_WEB_URL;
      return;
    }

    process.env.NEXT_PUBLIC_WEB_URL = originalBaseUrl;
  });

  it('ships a localized affiliate page file', () => {
    expect(
      existsSync(
        path.join(
          process.cwd(),
          'app/[locale]/(default)/affiliate/page.tsx'
        )
      )
    ).toBe(true);
  });

  it('uses the model-style centered hero copy without the old side card', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );

    expect(pageSource).toContain(
      'Earn Up to 30% Commission with Seedance affiliate program'
    );
    expect(pageSource).toContain(
      'Unlock the earning potential of your channel by promoting an innovative and powerful AI video generator!'
    );
    expect(pageSource).toContain('Sign Up Now');
    expect(pageSource).toContain('https://seedance.firstpromoter.com/');
    expect(pageSource).toContain(
      'target="_blank" rel="noopener noreferrer"'
    );
    expect(pageSource).not.toContain('mailto:support@seedance.tv');
    expect(pageSource).not.toContain('Start Your Application');
    expect(pageSource).not.toContain('ArrowRight');
    expect(pageSource).not.toContain('Mail,');
    expect(pageSource).toContain('flex flex-col items-center');
    expect(pageSource).toContain('fixed inset-0 -z-10');
    expect(pageSource).toContain('pb-20 pt-20');
    expect(pageSource).not.toContain('Seedance AI Partner Program');
    expect(pageSource).not.toContain('/og-image.png');
    expect(pageSource).not.toContain('md:grid-cols-[1.05fr_0.95fr]');
  });

  it('uses model-page styling for the lower affiliate sections', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );

    expect(pageSource).toContain('bg-gray-950');
    expect(pageSource).toContain('bg-white/[0.08]');
    expect(pageSource).toContain('min-h-[400px]');
    expect(pageSource).not.toContain("bg-[url('/imgs/elements/earth.png')]");
    expect(pageSource).not.toContain('bg-slate-900/50');
    expect(pageSource).not.toContain('w-full bg-background py-16 md:py-24');
    expect(pageSource).not.toContain('w-full border-y border-border/70 bg-muted');
  });

  it('keeps the why section as a plain model-style card grid without a background image', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );
    const whySection = pageSource.slice(
      pageSource.indexOf('id="why-partner"'),
      pageSource.indexOf('Promotion Rules')
    );

    expect(whySection).toContain('lg:grid-cols-4');
    expect(whySection).toContain('className={modelCardClass}');
    expect(whySection).toContain('className={modelIconClass}');
    expect(whySection).not.toContain('bg-[url(');
  });

  it('keeps the affiliate steps section consistent without a background image', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );
    const stepsSection = pageSource.slice(
      pageSource.indexOf('id="affiliate-steps"'),
      pageSource.indexOf('id="why-partner"')
    );

    expect(stepsSection).toContain('className={modelSectionClass}');
    expect(stepsSection).toContain('className={modelCardClass}');
    expect(stepsSection).toContain('className={modelIconClass}');
    expect(stepsSection).not.toContain('bg-[url(');
  });

  it('uses separated header bands for the dos and donts cards', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );
    const rulesSection = pageSource.slice(
      pageSource.indexOf('id="promotion-rules"'),
      pageSource.indexOf('Affiliate Program FAQs')
    );

    expect(rulesSection).toContain('overflow-hidden rounded-xl bg-white/[0.08]');
    expect(rulesSection).toContain('bg-white/[0.08] px-6 py-5');
    expect(rulesSection).not.toContain('bg-emerald-500/10');
    expect(rulesSection).not.toContain('bg-orange-500/10');
    expect(rulesSection).toContain('text-emerald-400');
    expect(rulesSection).toContain('Dos');
    expect(rulesSection).toContain('text-orange-400');
    expect(rulesSection).toContain('Don&apos;ts');
    expect(rulesSection).not.toContain('border border-emerald');
    expect(rulesSection).not.toContain('border border-red');
    expect(rulesSection).not.toContain('h-6 w-6 text-emerald-400');
    expect(rulesSection).not.toContain('h-6 w-6 text-red-400');
  });

  it('uses more compact typography below the hero', () => {
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'app/[locale]/(default)/affiliate/page.tsx'
      ),
      'utf-8'
    );
    const lowerPageSource = pageSource.slice(
      pageSource.indexOf('id="program-details"')
    );

    expect(pageSource).toContain(
      'text-3xl font-black text-foreground md:text-4xl'
    );
    expect(pageSource).toContain(
      'text-base leading-relaxed text-muted-foreground md:text-lg'
    );
    expect(pageSource).toContain(
      "const cardTitleClass = 'text-lg font-semibold text-white';"
    );
    expect(pageSource).toContain(
      "const cardBodyClass = 'mt-3 text-sm leading-6 text-white/80';"
    );
    expect(lowerPageSource).not.toContain(
      'text-4xl font-black text-foreground md:text-5xl'
    );
    expect(lowerPageSource).not.toContain('md:text-6xl lg:text-7xl');
  });

  it('includes affiliate in the public sitemap', async () => {
    const entries = await sitemap();

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://example.com/affiliate',
          changeFrequency: 'monthly',
          priority: 0.6,
        }),
      ])
    );
  });
});
