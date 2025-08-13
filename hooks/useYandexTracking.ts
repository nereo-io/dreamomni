"use client";

import { useEffect } from "react";
import { yandexTracking } from "@/services/analytics/yandex-tracking";

export function useYandexTracking() {
  const trackSignup = (method: string, userId?: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackUserRegistration(method, userId);
    }
  };

  const trackPayment = (orderId: string, amount: number, plan: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackPaymentSuccess({
        orderId,
        revenue: amount,
        products: [
          {
            id: plan,
            name: `${plan} Subscription`,
            price: amount,
            category: "subscription",
          },
        ],
      });
    }
  };

  const trackVideoGeneration = (provider: string, duration?: number, model?: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackVideoGenerated(provider, duration, model);
    }
  };

  const trackFirstVideo = (userId: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackFirstVideoCreated(userId);
    }
  };

  const trackCreditsPurchase = (amount: number, credits: number) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackCreditsPurchased(amount, credits);
    }
  };

  const trackPricingView = () => {
    if (typeof window !== "undefined") {
      yandexTracking.trackPricingViewed();
    }
  };

  const trackCheckoutStart = (plan: string, price: number) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackCheckoutStarted(plan, price);
    }
  };

  const trackSubscriptionUpgrade = (plan: string, price: number) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackSubscriptionUpgraded(plan, price);
    }
  };

  const trackPageView = (url?: string, title?: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackPageView(url, title);
    }
  };

  const trackNotBounce = () => {
    if (typeof window !== "undefined") {
      // Track after 15 seconds on page
      setTimeout(() => {
        yandexTracking.trackNotBounce();
      }, 15000);
    }
  };

  return {
    trackSignup,
    trackPayment,
    trackVideoGeneration,
    trackFirstVideo,
    trackCreditsPurchase,
    trackPricingView,
    trackCheckoutStart,
    trackSubscriptionUpgrade,
    trackPageView,
    trackNotBounce,
  };
}

export default useYandexTracking;