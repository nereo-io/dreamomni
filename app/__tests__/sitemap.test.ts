import { execSync } from 'child_process';
import { existsSync } from 'node:fs';
import sitemap from '@/app/sitemap';
import { MODEL_LANDING_PAGES } from '@/config/model-landing-pages';
import { locales } from '@/i18n/locale';
import { getPostsByLocale } from '@/models/post';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('@/models/post', () => ({
  getPostsByLocale: jest.fn(),
}));

const mockExecSync = jest.mocked(execSync);
const mockExistsSync = jest.mocked(existsSync);
const mockGetPostsByLocale = jest.mocked(getPostsByLocale);

describe('sitemap', () => {
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

  it('does not invoke git when repository metadata is unavailable', async () => {
    mockExistsSync.mockReturnValue(false);

    const entries = await sitemap();
    const expectedStaticPageCount = 9 * locales.length;
    const expectedModelPageCount = MODEL_LANDING_PAGES.length * locales.length;

    expect(mockExecSync).not.toHaveBeenCalled();
    expect(entries).toHaveLength(expectedStaticPageCount + expectedModelPageCount);
    expect(entries[0]?.lastModified).toBe('2026-03-18T00:00:00.000Z');
  });
});
