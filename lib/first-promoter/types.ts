export type FirstPromoterEventType =
  | 'signup'
  | 'sale'
  | 'cancellation'
  | 'refund';

export interface FirstPromoterSignupInput {
  userUuid: string;
  email: string;
  firstName?: string;
  trackingId?: string | null;
  refId?: string | null;
}

export interface FirstPromoterSaleInput {
  orderNo: string;
  paymentProvider: string;
  paymentId?: string | null;
  userUuid: string;
  email: string;
  amount: number;
  currency: string;
}

export interface FirstPromoterCancellationInput {
  paymentProvider: string;
  subscriptionId: string;
  userUuid?: string;
  email?: string;
}

export interface FirstPromoterRefundInput {
  paymentProvider: string;
  orderNo?: string;
  paymentId?: string;
  userUuid?: string;
  email?: string;
  amount: number;
  currency: string;
  reason?: string;
}

export type FirstPromoterTrackResult =
  | {
      success: true;
      skipped?: false;
      data?: unknown;
    }
  | {
      success: true;
      skipped: true;
      reason: 'missing_config';
    }
  | {
      success: false;
    };
