// Stripe 支付提供商 - 仅用于保持兼容性，不支持 V2 订阅

import { BasePaymentProvider } from './PaymentProvider';
import {
  MandateRequest,
  MandateResponse,
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionWebhookResult,
  PaymentError
} from './types';

export class StripeProvider extends BasePaymentProvider {
  name = 'stripe';
  
  validateConfig(): boolean {
    return !!(process.env.STRIPE_PRIVATE_KEY && process.env.STRIPE_PUBLIC_KEY);
  }
  
  /**
   * Stripe 不支持授权创建
   */
  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    throw new PaymentError(
      "NOT_SUPPORTED",
      "Stripe provider does not support mandate creation for V2 subscriptions",
      this.name
    );
  }
  
  /**
   * Stripe 不支持 V2 订阅
   */
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    throw new PaymentError(
      "NOT_SUPPORTED", 
      "Stripe provider does not support V2 subscription creation",
      this.name
    );
  }
  
  /**
   * Stripe 不支持 V2 订阅 Webhook
   */
  async handleSubscriptionWebhook(data: any): Promise<SubscriptionWebhookResult> {
    throw new PaymentError(
      "NOT_SUPPORTED",
      "Stripe provider does not support V2 subscription webhooks", 
      this.name
    );
  }
}