"use client";

import { useState, useCallback } from "react";
import { canUpgradeToTier, isSameTier } from "@/config/products";

export interface CurrentSubscription {
  product_id: string;
  product_name: string;
  tier_rank: number;
  amount: number;
  credits: number;
  interval: "month" | "year";
  provider: "payssion" | "creem" | "stripe";
  status: string;
  current_period_end?: string;
}

export interface CurrentSubscriptionState {
  hasActiveSubscription: boolean;
  currentSubscription: CurrentSubscription | null;
}

export default function useCurrentSubscription() {
  const [subscriptionState, setSubscriptionState] = useState<CurrentSubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentSubscription = useCallback(async (): Promise<CurrentSubscriptionState | null> => {
    if (isLoading) {
      return subscriptionState;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/current");
      const data = await response.json();

      if (data.code === 0) {
        const state: CurrentSubscriptionState = {
          hasActiveSubscription: data.data.hasActiveSubscription,
          currentSubscription: data.data.currentSubscription,
        };
        setSubscriptionState(state);
        return state;
      } else {
        setError(data.message || "Failed to fetch subscription");
        return null;
      }
    } catch (err) {
      console.error("Failed to fetch current subscription:", err);
      setError("Network error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, subscriptionState]);

  const canUpgradeTo = useCallback(
    (targetProductId: string): boolean => {
      if (!subscriptionState?.hasActiveSubscription) {
        // 无订阅用户可以购买任何套餐
        return true;
      }
      const currentProductId = subscriptionState.currentSubscription?.product_id || null;
      return canUpgradeToTier(currentProductId, targetProductId);
    },
    [subscriptionState]
  );

  const isCurrentPlan = useCallback(
    (targetProductId: string): boolean => {
      if (!subscriptionState?.hasActiveSubscription) {
        return false;
      }
      const currentProductId = subscriptionState.currentSubscription?.product_id || null;
      return isSameTier(currentProductId, targetProductId);
    },
    [subscriptionState]
  );

  const isDowngrade = useCallback(
    (targetProductId: string): boolean => {
      if (!subscriptionState?.hasActiveSubscription) {
        return false;
      }
      const currentProductId = subscriptionState.currentSubscription?.product_id || null;
      // 不是当前套餐，也不能升级，说明是降级
      return !isSameTier(currentProductId, targetProductId) && !canUpgradeToTier(currentProductId, targetProductId);
    },
    [subscriptionState]
  );

  return {
    subscriptionState,
    isLoading,
    error,
    fetchCurrentSubscription,
    canUpgradeTo,
    isCurrentPlan,
    isDowngrade,
  };
}
