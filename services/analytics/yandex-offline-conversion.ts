/**
 * Yandex Offline Conversion Service
 * 
 * Tracks offline conversions (purchases) back to Yandex Direct clicks
 * using the yclid (Yandex Click ID) parameter.
 * 
 * This enables accurate ROI measurement for Yandex Direct campaigns
 * by attributing actual purchases to specific ad clicks.
 */

class YandexOfflineConversionService {
  private counterId: string;
  private isDevelopment: boolean;
  
  constructor() {
    this.counterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Track a purchase conversion with Yandex Metrica
   * 
   * @param yclid - Yandex Click ID from the original ad click
   * @param orderId - Unique order identifier
   * @param amount - Purchase amount
   */
  async trackPurchase(yclid: string, orderId: string, amount: number): Promise<boolean> {
    // Skip if no yclid or counter ID
    if (!yclid || !this.counterId) {
      if (this.isDevelopment) {
        console.log('[YandexOfflineConversion] Skipped: missing yclid or counterId', { yclid, counterId: this.counterId });
      }
      return false;
    }
    
    try {
      // Construct the Metrica tracking URL
      const trackingUrl = `https://mc.yandex.ru/watch/${this.counterId}`;
      
      // Prepare the tracking data
      const params = new URLSearchParams({
        'page-url': `${process.env.NEXT_PUBLIC_WEB_URL || 'https://veo3ai.io'}/payment/success`,
        'page-ref': process.env.NEXT_PUBLIC_WEB_URL || 'https://veo3ai.io',
        'ecommerce': JSON.stringify({
          purchase: {
            actionField: {
              id: orderId,
              revenue: amount,
              currency: 'USD'
            },
            products: [{
              id: 'subscription',
              name: 'Veo3 AI Subscription',
              price: amount,
              quantity: 1,
              category: 'subscription'
            }]
          }
        }),
        'yclid': yclid,
        'ut': 'noindex' // Don't count as a pageview
      });

      // Send the tracking request
      const response = await fetch(trackingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      if (response.ok) {
        console.log(`✅ [YandexOfflineConversion] Purchase tracked successfully`, {
          yclid,
          orderId,
          amount
        });
        return true;
      } else {
        console.error(`❌ [YandexOfflineConversion] Failed to track purchase`, {
          status: response.status,
          statusText: response.statusText,
          yclid,
          orderId
        });
        return false;
      }
    } catch (error) {
      console.error('❌ [YandexOfflineConversion] Error tracking purchase:', error, {
        yclid,
        orderId,
        amount
      });
      return false;
    }
  }

  /**
   * Track payment success event (wrapper for trackPurchase)
   * Provides a more semantic method name for payment contexts
   */
  async trackPaymentSuccess(yclid: string, orderId: string, amount: number): Promise<boolean> {
    return this.trackPurchase(yclid, orderId, amount);
  }
}

// Export singleton instance
export const offlineConversionService = new YandexOfflineConversionService();