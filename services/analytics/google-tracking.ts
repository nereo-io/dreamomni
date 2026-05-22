'use client';

import { sendGAEvent } from '@next/third-parties/google';
import {
  trackTikTokBeginCheckout,
  trackTikTokFirstGeneration,
  trackTikTokPurchase,
} from '@/services/analytics/tiktok-tracking';

const GOOGLE_ADS_SIGN_UP_SEND_TO = 'AW-18089132023/KzuXCOTHr58cEPf_yLFD';
const GOOGLE_ADS_GENERATE_VIDEO_SEND_TO =
  'AW-18089132023/tOuvCOfHr58cEPf_yLFD';
const GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO =
  'AW-18089132023/34DaCOrHr58cEPf_yLFD';
const GOOGLE_ADS_PURCHASE_SEND_TO = 'AW-18089132023/b1pYCPPR3ZscEPf_yLFD';

interface GAItem {
  itemId?: string;
  itemName: string;
  amountCents: number;
  currency?: string;
  quantity?: number;
  interval?: string;
  credits?: number;
}

interface GAPurchaseInfo extends GAItem {
  transactionId: string;
  paidAt?: string;
}

interface GAGenerationInfo {
  model: string;
  stage?: 'started' | 'completed';
  duration?: string | number;
  generationType?: string;
  mode?: string;
  provider?: string;
  agentMode?: boolean;
  imageCount?: number;
}

function canTrack(): boolean {
  return typeof window !== 'undefined';
}

function toCurrencyValue(amountCents: number): number {
  return Number((amountCents / 100).toFixed(2));
}

function normalizeCurrency(currency?: string): string {
  return (currency || 'USD').toUpperCase();
}

function buildItem(item: GAItem) {
  return {
    item_id: item.itemId,
    item_name: item.itemName,
    price: toCurrencyValue(item.amountCents),
    quantity: item.quantity || 1,
    ...(item.interval ? { item_category: item.interval } : {}),
    ...(typeof item.credits === 'number' ? { credits: item.credits } : {}),
  };
}

function trackGoogleAdsConversion(
  sendTo: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (!canTrack()) {
    return;
  }

  const callback = function () {
    return undefined;
  };

  sendGAEvent('event', 'conversion', {
    send_to: sendTo,
    ...params,
    event_callback: callback,
  });
}

function markTracked(key: string): boolean {
  if (!canTrack()) {
    return false;
  }

  try {
    const storageKey = `ga4_tracked:${key}`;
    if (window.localStorage.getItem(storageKey)) {
      return false;
    }
    window.localStorage.setItem(storageKey, '1');
    return true;
  } catch {
    return true;
  }
}

export function trackGASignUp(method: string, userId?: string) {
  if (!canTrack()) {
    return;
  }

  sendGAEvent('event', 'sign_up', {
    method,
    ...(userId ? { user_id: userId } : {}),
  });
  trackGoogleAdsConversion(GOOGLE_ADS_SIGN_UP_SEND_TO);
}

export function trackGABeginCheckout(item: GAItem) {
  if (!canTrack()) {
    return;
  }

  trackTikTokBeginCheckout(item);
  sendGAEvent('event', 'begin_checkout', {
    currency: normalizeCurrency(item.currency),
    value: toCurrencyValue(item.amountCents),
    items: [buildItem(item)],
    ...(item.interval ? { plan_interval: item.interval } : {}),
  });
  trackGoogleAdsConversion(GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO);
}

export function trackGAPurchase(info: GAPurchaseInfo) {
  if (!canTrack()) {
    return;
  }

  const dedupeKey =
    info.transactionId ||
    `${info.itemName}:${info.amountCents}:${info.paidAt || ''}`;

  if (!markTracked(`purchase:${dedupeKey}`)) {
    return;
  }

  const payload = {
    transaction_id: info.transactionId,
    currency: normalizeCurrency(info.currency),
    value: toCurrencyValue(info.amountCents),
    items: [buildItem(info)],
    ...(info.interval ? { plan_interval: info.interval } : {}),
    ...(info.paidAt ? { paid_at: info.paidAt } : {}),
  };

  sendGAEvent('event', 'purchase', payload);
  sendGAEvent('event', 'payment_success', payload);
  trackTikTokPurchase(info);
  trackGoogleAdsConversion(GOOGLE_ADS_PURCHASE_SEND_TO, {
    value: payload.value,
    currency: payload.currency,
    transaction_id: payload.transaction_id,
  });
}

export function trackGAGenerateVideo(info: GAGenerationInfo) {
  if (!canTrack()) {
    return;
  }

  trackTikTokFirstGeneration({
    contentType: 'video',
    model: info.model,
    stage: info.stage || 'started',
    generationType: info.generationType,
  });
  sendGAEvent('event', 'generate_video', {
    model: info.model,
    stage: info.stage || 'started',
    ...(info.duration !== undefined ? { duration: String(info.duration) } : {}),
    ...(info.generationType ? { generation_type: info.generationType } : {}),
  });
  trackGoogleAdsConversion(GOOGLE_ADS_GENERATE_VIDEO_SEND_TO);
}

export function trackGAGenerateImage(info: GAGenerationInfo) {
  if (!canTrack()) {
    return;
  }

  trackTikTokFirstGeneration({
    contentType: 'image',
    model: info.model,
    stage: info.stage || 'started',
    generationType: info.mode,
    provider: info.provider,
  });
  sendGAEvent('event', 'generate_image', {
    model: info.model,
    stage: info.stage || 'started',
    ...(info.mode ? { generation_mode: info.mode } : {}),
    ...(info.provider ? { provider: info.provider } : {}),
    ...(typeof info.agentMode === 'boolean'
      ? { agent_mode: String(info.agentMode) }
      : {}),
    ...(typeof info.imageCount === 'number'
      ? { image_count: info.imageCount }
      : {}),
  });
}
