import { getFirstPromoterConfig } from '@/lib/first-promoter/config';
import {
  FirstPromoterCancellationInput,
  FirstPromoterRefundInput,
  FirstPromoterSaleInput,
  FirstPromoterSignupInput,
  FirstPromoterTrackResult,
} from '@/lib/first-promoter/types';

const FIRST_PROMOTER_TRACKING_API_BASE =
  'https://api.firstpromoter.com/api/v2/track';

function normalizeCurrency(currency: string) {
  return (currency || '').trim().toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function withDefinedValues(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).flatMap(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return [];
      }

      if (isPlainObject(value)) {
        const compacted = withDefinedValues(value);
        return Object.keys(compacted).length > 0 ? [[key, compacted]] : [];
      }

      return [[key, value]];
    })
  );
}

async function sendFirstPromoterEvent(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<FirstPromoterTrackResult> {
  const config = getFirstPromoterConfig();

  if (!config) {
    console.log('[FirstPromoter] Skipping track: missing config', {
      endpoint,
    });
    return {
      success: true,
      skipped: true,
      reason: 'missing_config',
    };
  }

  try {
    const response = await fetch(
      `${FIRST_PROMOTER_TRACKING_API_BASE}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Account-ID': config.accountId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withDefinedValues(payload)),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[FirstPromoter] Track failed', {
        endpoint,
        status: response.status,
        body,
      });
      return { success: false };
    }

    const data = await response.json().catch(() => undefined);
    return { success: true, data };
  } catch (error) {
    console.error('[FirstPromoter] Track exception', {
      endpoint,
      error,
    });
    return { success: false };
  }
}

export async function trackFirstPromoterSignup(
  input: FirstPromoterSignupInput
): Promise<FirstPromoterTrackResult> {
  const payload: Record<string, unknown> = {
    email: input.email,
    uid: input.userUuid,
    first_name: input.firstName,
  };

  if (input.trackingId) {
    payload.tid = input.trackingId;
  } else if (input.refId) {
    payload.ref_id = input.refId;
  }

  return sendFirstPromoterEvent('signup', payload);
}

export async function trackFirstPromoterSale(
  input: FirstPromoterSaleInput
): Promise<FirstPromoterTrackResult> {
  return sendFirstPromoterEvent('sale', {
    event_id: input.paymentId || input.orderNo,
    uid: input.userUuid,
    email: input.email,
    amount: input.amount,
    currency: normalizeCurrency(input.currency),
    metadata: {
      order_no: input.orderNo,
      payment_provider: input.paymentProvider,
    },
  });
}

export async function trackFirstPromoterCancellation(
  input: FirstPromoterCancellationInput
): Promise<FirstPromoterTrackResult> {
  return sendFirstPromoterEvent('cancellation', {
    event_id: input.subscriptionId,
    uid: input.userUuid,
    email: input.email,
    metadata: {
      payment_provider: input.paymentProvider,
      subscription_id: input.subscriptionId,
    },
  });
}

export async function trackFirstPromoterRefund(
  input: FirstPromoterRefundInput
): Promise<FirstPromoterTrackResult> {
  return sendFirstPromoterEvent('refund', {
    event_id: input.paymentId || input.orderNo,
    uid: input.userUuid,
    email: input.email,
    amount: input.amount,
    currency: normalizeCurrency(input.currency),
    reason: input.reason,
    metadata: {
      order_no: input.orderNo,
      payment_provider: input.paymentProvider,
    },
  });
}
