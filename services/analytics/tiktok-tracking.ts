'use client';

interface TikTokQueue {
  track?: (eventName: string, params?: TikTokParams) => void;
}

declare global {
  interface Window {
    ttq?: TikTokQueue;
  }
}

type TikTokParamValue = string | number | boolean | undefined;
type TikTokParams = Record<string, TikTokParamValue>;

export interface TikTokItem {
  itemId?: string;
  itemName: string;
  amountCents: number;
  currency?: string;
  quantity?: number;
  interval?: string;
  credits?: number;
}

export interface TikTokPurchaseInfo extends TikTokItem {
  transactionId: string;
  paidAt?: string;
}

export interface TikTokGenerationInfo {
  contentType: 'image' | 'video';
  model: string;
  stage?: 'started' | 'completed';
  generationType?: string;
  mode?: string;
  provider?: string;
}

function canTrack(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.ttq?.track === 'function'
  );
}

function toCurrencyValue(amountCents: number): number {
  return Number((amountCents / 100).toFixed(2));
}

function normalizeCurrency(currency?: string): string {
  return (currency || 'USD').toUpperCase();
}

function cleanParams(params: TikTokParams): TikTokParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );
}

function markTracked(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storageKey = `tiktok_tracked:${key}`;
    if (window.localStorage.getItem(storageKey)) {
      return false;
    }
    window.localStorage.setItem(storageKey, '1');
    return true;
  } catch {
    return true;
  }
}

export function trackTikTokEvent(
  eventName: string,
  params?: TikTokParams
): void {
  if (!canTrack()) {
    return;
  }

  window.ttq?.track?.(eventName, params ? cleanParams(params) : undefined);
}

export function trackTikTokSignUp(method: string, userId?: string): void {
  if (!canTrack()) {
    return;
  }

  const dedupeKey = userId || method;
  if (!markTracked(`sign_up:${dedupeKey}`)) {
    return;
  }

  trackTikTokEvent('CompleteRegistration', {
    content_name: 'sign_up',
    method,
    external_id: userId,
  });
}

export function trackTikTokBeginCheckout(item: TikTokItem): void {
  trackTikTokEvent('InitiateCheckout', {
    content_id: item.itemId,
    content_name: item.itemName,
    content_type: item.interval || 'product',
    currency: normalizeCurrency(item.currency),
    value: toCurrencyValue(item.amountCents),
    quantity: item.quantity || 1,
    credits: item.credits,
  });
}

export function trackTikTokPurchase(info: TikTokPurchaseInfo): void {
  if (!canTrack()) {
    return;
  }

  const dedupeKey =
    info.transactionId ||
    `${info.itemName}:${info.amountCents}:${info.paidAt || ''}`;

  if (!markTracked(`purchase:${dedupeKey}`)) {
    return;
  }

  trackTikTokEvent('Purchase', {
    event_id: info.transactionId,
    content_id: info.itemId,
    content_name: info.itemName,
    content_type: info.interval || 'product',
    currency: normalizeCurrency(info.currency),
    value: toCurrencyValue(info.amountCents),
    quantity: info.quantity || 1,
    credits: info.credits,
  });
}

export function trackTikTokFirstGeneration(info: TikTokGenerationInfo): void {
  if (!canTrack()) {
    return;
  }

  if (!markTracked('first_generation')) {
    return;
  }

  trackTikTokEvent('FirstGeneration', {
    content_type: info.contentType,
    content_name: info.model,
    status: info.stage || 'started',
    generation_type: info.generationType || info.mode,
    provider: info.provider,
  });
}
