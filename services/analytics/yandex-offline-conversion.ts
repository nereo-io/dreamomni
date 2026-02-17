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
  clientId?: string;
  userId?: string;
  yclid?: string;
  purchaseId?: string;
  target: string;
  dateTime: number; // Unix timestamp
  price?: number; // Goal value
  currency?: string; // ISO 4217 currency code
}

interface PaymentConversionIdentifier {
  clientId?: string | null;
  userId?: string | null;
  yclid?: string | null;
  purchaseId?: string | null;
}

class YandexOfflineConversionService {
  private counterId: string = "";
  private oauthToken: string = "";
  private paymentGoalTarget: string = "PAYMENT_SUCCESS";
  private apiBaseUrl = "https://api-metrica.yandex.net/management/v1";
  private isDevelopment: boolean;

  constructor() {
    // Load environment variables (they might be loaded after construction in Next.js)
    this.reloadConfig();
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }

  private reloadConfig() {
    this.counterId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || "";
    this.oauthToken =
      process.env.YANDEX_METRICA_OAUTH_TOKEN ||
      process.env.YANDEX_OFFLINE_CONVERSION_TOKEN ||
      "";
    this.paymentGoalTarget =
      process.env.YANDEX_METRICA_PAYMENT_GOAL_TARGET ||
      process.env.YANDEX_METRICA_PAYMENT_GOAL_ID ||
      "PAYMENT_SUCCESS";
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
        console.log("[YandexOfflineConversion] Not configured:", {
          hasToken: !!this.oauthToken,
          hasCounterId: !!this.counterId,
        });
      }
      return { success: false, error: "Not configured" };
    }

    const validConversions = conversions.filter((conversion) =>
      this.hasAnyIdentifier(conversion)
    );

    if (validConversions.length === 0) {
      return { success: false, error: "No conversions to upload" };
    }

    try {
      const csvContent = this.createCSV(validConversions);

      if (this.isDevelopment) {
        console.log(
          "[YandexOfflineConversion] CSV Preview:",
          csvContent.split("\n").slice(0, 3).join("\n")
        );
      }

      // Create form data
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      formData.append("file", blob, "conversions.csv");

      // Build URL with query parameters
      let url = `${this.apiBaseUrl}/counter/${this.counterId}/offline_conversions/upload`;
      const params = new URLSearchParams();

      if (comment) {
        params.append("comment", comment.substring(0, 255)); // Max 255 chars
      }

      url += `?${params.toString()}`;

      // Upload to API
      if (this.isDevelopment) {
        console.log("[YandexOfflineConversion] Uploading to:", url);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `OAuth ${this.oauthToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        console.log("✅ [YandexOfflineConversion] Upload successful", {
          uploadId: result.uploading?.id,
          status: result.uploading?.status,
        });

        return {
          success: true,
          uploadId: result.uploading?.id,
        };
      } else {
        const errorText = await response.text();
        const error = `Upload failed: ${response.status} ${response.statusText}`;
        console.error(`❌ [YandexOfflineConversion] ${error}`);
        console.error(`   Response: ${errorText}`);
        return { success: false, error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ [YandexOfflineConversion] Exception:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create CSV content for offline conversions.
   * At least one of ClientId/UserId/Yclid/PurchaseId is required per row.
   */
  private createCSV(conversions: OfflineConversionRow[]): string {
    const headers = [
      "ClientId",
      "UserId",
      "Yclid",
      "PurchaseId",
      "Target",
      "DateTime",
      "Price",
      "Currency",
    ];

    const rows = conversions.map((conv) => {
      return [
        conv.clientId || "",
        conv.userId || "",
        conv.yclid || "",
        conv.purchaseId || "",
        conv.target,
        conv.dateTime.toString(),
        conv.price?.toString() || "",
        conv.currency || "",
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Upload a single payment conversion (convenience method)
   */
  async trackPaymentSuccess(
    identifierOrClientId: string | PaymentConversionIdentifier,
    orderId: string,
    amount: number
  ): Promise<boolean> {
    this.reloadConfig();

    const identifier = this.normalizeIdentifier(identifierOrClientId);
    if (!this.hasAnyIdentifier(identifier)) {
      if (this.isDevelopment) {
        console.log(
          "[YandexOfflineConversion] Skip conversion: missing identifiers",
          { orderId }
        );
      }
      return false;
    }

    const conversion: OfflineConversionRow = {
      clientId: identifier.clientId || undefined,
      userId: identifier.userId || undefined,
      yclid: identifier.yclid || undefined,
      purchaseId: identifier.purchaseId || orderId,
      target: this.paymentGoalTarget,
      dateTime: Math.floor(Date.now() / 1000), // Current Unix timestamp
      price: amount,
      currency: "USD",
    };

    const result = await this.uploadConversions(
      [conversion],
      `Payment for order ${orderId}`
    );

    return result.success;
  }

  private normalizeIdentifier(
    identifierOrClientId: string | PaymentConversionIdentifier
  ): PaymentConversionIdentifier {
    if (typeof identifierOrClientId === "string") {
      return { clientId: identifierOrClientId };
    }
    return identifierOrClientId || {};
  }

  private hasAnyIdentifier(conversion: PaymentConversionIdentifier): boolean {
    return !!(conversion.clientId || conversion.userId || conversion.yclid);
  }
}

// Export singleton instance
export const offlineConversionService = new YandexOfflineConversionService();
