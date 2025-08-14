interface TrackingEventParams {
  [key: string]: any;
}

interface EcommerceProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
  variant?: string;
}

interface PurchaseData {
  orderId: string;
  revenue: number;
  products: EcommerceProduct[];
  coupon?: string;
  tax?: number;
  shipping?: number;
}

class YandexTracking {
  private counterId: number;
  private isDevelopment: boolean;

  constructor() {
    this.counterId = parseInt(process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '0');
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ym === 'function' && this.counterId > 0;
  }

  private log(action: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[Yandex Metrica] ${action}`, data);
    }
  }

  reachGoal(goalName: string, params?: TrackingEventParams) {
    if (!this.isAvailable()) {
      this.log(`Goal skipped (not available): ${goalName}`, params);
      return;
    }

    try {
      window.ym(this.counterId, 'reachGoal', goalName, params);
      this.log(`Goal reached: ${goalName}`, params);
    } catch (error) {
      console.error('[Yandex Metrica] Error reaching goal:', error);
    }
  }

  trackUserRegistration(method: string, userId?: string) {
    this.reachGoal('SIGNUP_COMPLETED', {
      method,
      user_id: userId,
      timestamp: new Date().toISOString()
    });

    if (userId) {
      this.setUserParams({ registered_user: true, user_id: userId });
    }
  }

  trackPaymentSuccess(purchase: PurchaseData) {
    this.reachGoal('PAYMENT_SUCCESS', {
      order_id: purchase.orderId,
      order_price: purchase.revenue,
      currency: 'USD',
      products_count: purchase.products.length
    });

    this.trackEcommercePurchase(purchase);
  }

  trackVideoGenerated(provider: string, duration?: number, model?: string) {
    this.reachGoal('VIDEO_GENERATED', {
      provider,
      duration,
      model,
      timestamp: new Date().toISOString()
    });
  }

  trackFirstVideoCreated(userId: string) {
    this.reachGoal('FIRST_VIDEO_CREATED', {
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionUpgraded(plan: string, price: number) {
    this.reachGoal('SUBSCRIPTION_UPGRADED', {
      plan,
      price,
      currency: 'USD',
      timestamp: new Date().toISOString()
    });
  }

  trackPricingViewed() {
    this.reachGoal('PRICING_VIEWED', {
      timestamp: new Date().toISOString()
    });
  }

  trackCheckoutStarted(plan: string, price: number) {
    this.reachGoal('CHECKOUT_STARTED', {
      plan,
      price,
      currency: 'USD'
    });
  }

  trackCreditsPurchased(amount: number, credits: number) {
    this.reachGoal('CREDITS_PURCHASED', {
      amount,
      credits,
      currency: 'USD'
    });
  }

  trackEcommercePurchase(purchase: PurchaseData) {
    if (!this.isAvailable()) {
      this.log('Ecommerce purchase skipped (not available)', purchase);
      return;
    }

    try {
      const ecommerceData = {
        purchase: {
          actionField: {
            id: purchase.orderId,
            revenue: purchase.revenue,
            coupon: purchase.coupon,
            tax: purchase.tax,
            shipping: purchase.shipping
          },
          products: purchase.products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category || 'subscription',
            quantity: product.quantity || 1,
            variant: product.variant
          }))
        }
      };

      if (window.dataLayer) {
        window.dataLayer.push({
          ecommerce: ecommerceData
        });
      }

      this.log('Ecommerce purchase tracked', ecommerceData);
    } catch (error) {
      console.error('[Yandex Metrica] Error tracking ecommerce:', error);
    }
  }

  trackAddToCart(product: EcommerceProduct) {
    if (!this.isAvailable()) return;

    try {
      if (window.dataLayer) {
        window.dataLayer.push({
          ecommerce: {
            add: {
              products: [{
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category || 'subscription',
                quantity: product.quantity || 1
              }]
            }
          }
        });
      }

      this.log('Add to cart tracked', product);
    } catch (error) {
      console.error('[Yandex Metrica] Error tracking add to cart:', error);
    }
  }

  setUserParams(params: Record<string, any>) {
    if (!this.isAvailable()) return;

    try {
      window.ym(this.counterId, 'userParams', params);
      this.log('User params set', params);
    } catch (error) {
      console.error('[Yandex Metrica] Error setting user params:', error);
    }
  }

  trackPageView(url?: string, title?: string) {
    if (!this.isAvailable()) return;

    try {
      window.ym(this.counterId, 'hit', url || window.location.href, {
        title: title || document.title
      });
      this.log('Page view tracked', { url, title });
    } catch (error) {
      console.error('[Yandex Metrica] Error tracking page view:', error);
    }
  }

  trackNotBounce() {
    if (!this.isAvailable()) return;

    try {
      window.ym(this.counterId, 'notBounce');
      this.log('Not bounce tracked');
    } catch (error) {
      console.error('[Yandex Metrica] Error tracking not bounce:', error);
    }
  }
}

export const yandexTracking = new YandexTracking();

declare global {
  interface Window {
    dataLayer?: any[];
  }
}