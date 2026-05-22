import {
  DEFAULT_POST_LOGIN_REDIRECT,
  getPostLoginRedirect,
} from '@/lib/auth-redirect';

describe('auth redirect defaults', () => {
  it('defaults post-login users to Omni Studio', () => {
    expect(DEFAULT_POST_LOGIN_REDIRECT).toBe('/omni-studio');
    expect(getPostLoginRedirect()).toBe('/omni-studio');
    expect(getPostLoginRedirect(null)).toBe('/omni-studio');
    expect(getPostLoginRedirect('')).toBe('/omni-studio');
  });

  it('keeps an explicit callback URL when present', () => {
    expect(getPostLoginRedirect('/pricing')).toBe('/pricing');
  });
});
