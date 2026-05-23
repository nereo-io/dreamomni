import {
  trackTikTokBeginCheckout,
  trackTikTokFirstGeneration,
  trackTikTokPurchase,
  trackTikTokSignUp,
} from '@/services/analytics/tiktok-tracking';

type StoredValues = Record<string, string>;

function installWindow(track = jest.fn()) {
  const storedValues: StoredValues = {};

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      ttq: {
        track,
      },
      localStorage: {
        getItem: jest.fn((key: string) => storedValues[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          storedValues[key] = value;
        }),
      },
    },
  });

  return { track, storedValues };
}

function installWindowWithoutTikTok() {
  const storedValues: StoredValues = {};
  const setItem = jest.fn((key: string, value: string) => {
    storedValues[key] = value;
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: jest.fn((key: string) => storedValues[key] ?? null),
        setItem,
      },
    },
  });

  return { setItem };
}

describe('TikTok tracking helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { window?: unknown }).window;
  });

  it('tracks registration as CompleteRegistration', () => {
    const { track } = installWindow();

    trackTikTokSignUp('google', 'user-123');

    expect(track).toHaveBeenCalledWith('CompleteRegistration', {
      content_name: 'sign_up',
      method: 'google',
      external_id: 'user-123',
    });
  });

  it('tracks order creation as InitiateCheckout', () => {
    const { track } = installWindow();

    trackTikTokBeginCheckout({
      itemId: 'plus-monthly',
      itemName: 'Plus Monthly',
      amountCents: 1999,
      currency: 'usd',
      quantity: 1,
      interval: 'month',
      credits: 2000,
    });

    expect(track).toHaveBeenCalledWith('InitiateCheckout', {
      content_id: 'plus-monthly',
      content_name: 'Plus Monthly',
      content_type: 'product',
      plan_interval: 'month',
      currency: 'USD',
      value: 19.99,
      quantity: 1,
      credits: 2000,
    });
  });

  it('tracks purchases once per transaction id', () => {
    const { track } = installWindow();

    const purchase = {
      transactionId: 'order-123',
      itemId: 'bundle-100',
      itemName: '100 Credits',
      amountCents: 999,
      currency: 'usd',
      quantity: 1,
      interval: 'one-time',
      credits: 100,
    };

    trackTikTokPurchase(purchase);
    trackTikTokPurchase(purchase);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Purchase', {
      event_id: 'order-123',
      content_id: 'bundle-100',
      content_name: '100 Credits',
      content_type: 'product',
      plan_interval: 'one-time',
      currency: 'USD',
      value: 9.99,
      quantity: 1,
      credits: 100,
    });
  });

  it('tracks only the first generation interaction', () => {
    const { track } = installWindow();

    trackTikTokFirstGeneration({
      contentType: 'video',
      model: 'veo3',
      stage: 'started',
      generationType: 'standard',
    });
    trackTikTokFirstGeneration({
      contentType: 'image',
      model: 'seedream',
      stage: 'started',
      generationType: 'text-to-image',
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('FirstGeneration', {
      content_type: 'video',
      content_name: 'veo3',
      status: 'started',
      generation_type: 'standard',
    });
  });

  it('does not consume a dedupe key before TikTok is ready', () => {
    const { setItem } = installWindowWithoutTikTok();

    trackTikTokPurchase({
      transactionId: 'order-early',
      itemName: 'Plus Monthly',
      amountCents: 1999,
    });

    expect(setItem).not.toHaveBeenCalled();
  });
});
