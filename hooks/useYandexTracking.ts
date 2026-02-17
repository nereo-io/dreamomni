"use client";

import { useCallback, useRef } from "react";
import { yandexTracking } from "@/services/analytics/yandex-tracking";

export function useYandexTracking() {
  // 使用 useRef 来追踪已触发的事件，避免重复上报
  const trackedEvents = useRef<{ [key: string]: number }>({});

  const trackSignup = useCallback((method: string, userId?: string) => {
    if (typeof window === "undefined") return;
    yandexTracking.trackUserRegistration(method, userId);
  }, []);

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

  const trackImageGeneration = (model: string, prompt?: string) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackImageGenerated(model, prompt?.length);
    }
  };

  const trackCreditsPurchase = (amount: number, credits: number) => {
    if (typeof window !== "undefined") {
      yandexTracking.trackCreditsPurchased(amount, credits);
    }
  };

  const trackPricingView = useCallback(() => {
    if (typeof window !== "undefined") {
      const now = Date.now();
      const lastTracked = trackedEvents.current['PRICING_VIEWED'];
      
      // 10分钟内只上报一次（600000毫秒 = 10分钟）
      if (!lastTracked || now - lastTracked > 600000) {
        yandexTracking.trackPricingViewed();
        trackedEvents.current['PRICING_VIEWED'] = now;
      }
    }
  }, []);

  const trackCheckoutStart = useCallback((plan: string, price: number) => {
    if (typeof window !== "undefined") {
      const now = Date.now();
      const key = `CHECKOUT_${plan}`;
      const lastTracked = trackedEvents.current[key];
      
      // 5分钟内同一个plan只上报一次（300000毫秒 = 5分钟）
      if (!lastTracked || now - lastTracked > 300000) {
        yandexTracking.trackCheckoutStarted(plan, price);
        trackedEvents.current[key] = now;
      }
    }
  }, []);

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
    trackImageGeneration,
    trackCreditsPurchase,
    trackPricingView,
    trackCheckoutStart,
    trackSubscriptionUpgrade,
    trackPageView,
    trackNotBounce,
  };
}

export default useYandexTracking;
