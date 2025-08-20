/**
 * Yandex Metrica Offline Conversion Service
 * 
 * Based on official documentation:
 * https://yandex.com/dev/metrika/en/management/offline-conv
 * https://yandex.com/dev/metrika/en/management/openapi/offline_conversions/upload_1
 * 
 * Tracks offline conversions using the official Management API with OAuth authentication.
 * Requires YANDEX_METRICA_OAUTH_TOKEN to be configured.
 */

interface OfflineConversionRow {
  yclid: string;       // Yandex Direct click ID (required)
  target: string;      // Goal ID (numeric)
  dateTime: number;    // Unix timestamp
  price?: number;      // Goal value
  currency?: string;   // ISO 4217 currency code
}


class YandexOfflineConversionService {
  private counterId: string = '';
  private oauthToken: string = '';
  private apiBaseUrl = 'https://api-metrica.yandex.net/management/v1';
  private isDevelopment: boolean;
  
  constructor() {
    // Load environment variables (they might be loaded after construction in Next.js)
    this.reloadConfig();
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }
  
  private reloadConfig() {
    this.counterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';
    this.oauthToken = process.env.YANDEX_METRICA_OAUTH_TOKEN || '';
  }

  /**
   * Upload offline conversions using official API
   * This is the recommended way by Yandex documentation
   */
  async uploadConversions(
    conversions: OfflineConversionRow[],
    comment?: string
  ): Promise<{ success: boolean; uploadId?: number; error?: string }> {
    // Reload config in case env vars were loaded after construction
    this.reloadConfig();
    
    // Check prerequisites - these are required
    if (!this.oauthToken || !this.counterId) {
      if (this.isDevelopment) {
        console.log('[YandexOfflineConversion] Not configured:', {
          hasToken: !!this.oauthToken,
          hasCounterId: !!this.counterId
        });
      }
      return { success: false, error: 'Not configured' };
    }

    if (conversions.length === 0) {
      return { success: false, error: 'No conversions to upload' };
    }

    try {
      // Create CSV content for YCLID conversions
      const csvContent = this.createCSV(conversions);
      
      if (this.isDevelopment) {
        console.log('[YandexOfflineConversion] CSV Preview:', csvContent.split('\n').slice(0, 3).join('\n'));
      }

      // Create form data
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      formData.append('file', blob, 'conversions.csv');

      // Build URL with query parameters
      let url = `${this.apiBaseUrl}/counter/${this.counterId}/offline_conversions/upload`;
      const params = new URLSearchParams();
      
      // Always use YCLID type
      params.append('client_id_type', 'YCLID');
      
      if (comment) {
        params.append('comment', comment.substring(0, 255)); // Max 255 chars
      }
      
      url += `?${params.toString()}`;

      // Upload to API
      if (this.isDevelopment) {
        console.log('[YandexOfflineConversion] Uploading to:', url);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${this.oauthToken}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ [YandexOfflineConversion] Upload successful', {
          uploadId: result.uploading?.id,
          status: result.uploading?.status
        });
        
        return { 
          success: true, 
          uploadId: result.uploading?.id 
        };
      } else {
        const errorText = await response.text();
        const error = `Upload failed: ${response.status} ${response.statusText}`;
        console.error(`❌ [YandexOfflineConversion] ${error}`);
        console.error(`   Response: ${errorText}`);
        return { success: false, error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [YandexOfflineConversion] Exception:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create CSV content for YCLID conversions
   */
  private createCSV(conversions: OfflineConversionRow[]): string {
    const headers = ['Yclid', 'Target', 'DateTime', 'Price', 'Currency'];
    
    const rows = conversions.map(conv => {
      return [
        conv.yclid,
        conv.target,
        conv.dateTime.toString(),
        conv.price?.toString() || '',
        conv.currency || ''
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Upload a single payment conversion (convenience method)
   */
  async trackPaymentSuccess(
    yclid: string, 
    orderId: string, 
    amount: number
  ): Promise<boolean> {
    // Note: In production, use numeric goal ID (460791468) instead of string
    // The goal must be created first in Yandex Metrica
    const conversion: OfflineConversionRow = {
      yclid,
      target: 'PAYMENT_SUCCESS', // Numeric ID for PAYMENT_SUCCESS goal
      dateTime: Math.floor(Date.now() / 1000), // Current Unix timestamp
      price: amount,
      currency: 'USD'
    };

    const result = await this.uploadConversions(
      [conversion],
      `Payment for order ${orderId}`
    );
    
    return result.success;
  }

}

// Export singleton instance
export const offlineConversionService = new YandexOfflineConversionService();