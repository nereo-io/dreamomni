import { trackFPRSignUp } from '@/services/analytics/first-promoter';

describe('trackFPRSignUp', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    jest.restoreAllMocks();
  });

  it('sends FirstPromoter referral user id as uid', () => {
    const fpr = jest.fn();
    (globalThis as any).window = { fpr };
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    trackFPRSignUp({
      email: 'user@example.com',
      userId: 'user_123',
    });

    expect(fpr).toHaveBeenCalledWith('referral', {
      email: 'user@example.com',
      uid: 'user_123',
    });
  });
});
