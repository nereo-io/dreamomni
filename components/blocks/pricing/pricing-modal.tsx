"use client";

import { Check, Loader, Crown, X } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { sendGAEvent } from "@next/third-parties/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  getAvailablePaymentMethods,
  PaymentMethodConfig,
} from "@/lib/payment-methods";
import { useTranslations } from "next-intl";
import HighlightFeature from "./highlight-feature";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import CreditsBundleModal, {
  BundleItem,
} from "@/components/ui/credits-bundle-modal";
import useCurrentSubscription from "@/hooks/useCurrentSubscription";
import { trackUetEvent } from "@/lib/bing-uet";
import {
  trackGABeginCheckout,
  trackGAPurchase,
} from "@/services/analytics/google-tracking";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: PricingType;
}

export default function PricingModal({
  isOpen,
  onClose,
  pricing,
}: PricingModalProps) {
  const { user, setShowSignModal } = useAppContext();
  const { loading: locationLoading, isRussia } = useGeolocation();
  const t = useTranslations("pricing_modal");
  const tBundle = useTranslations("creditsBundle");
  const { trackPricingView, trackCheckoutStart } = useYandexTracking();
  const {
    subscriptionState,
    fetchCurrentSubscription,
    canUpgradeTo,
    isCurrentPlan,
    isDowngrade,
  } = useCurrentSubscription();

  const [group, setGroup] = useState<string | undefined>(
    pricing.groups?.[0]?.name,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodConfig[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [hasUserSelectedGroup, setHasUserSelectedGroup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    planName?: string;
    credits?: number;
    nextBilling?: string;
    isMonthlyDistribution?: boolean;
    monthlyCredits?: number;
    totalCredits?: number;
    remainingMonths?: number;
  }>({});

  const visiblePlans = useMemo(() => {
    if (!pricing.items?.length) {
      return [] as PricingItem[];
    }

    return pricing.items.filter((item) => {
      if (item.group && group && item.group !== group) {
        return false;
      }
      if (item.amount === 0 || item.product_id === "free-plan") {
        return false;
      }
      return true;
    });
  }, [pricing.items, group]);

  const gridColumnsClass = useMemo(() => {
    if (visiblePlans.length >= 3) {
      return "md:grid-cols-2 lg:grid-cols-3";
    }
    if (visiblePlans.length === 2) {
      return "md:grid-cols-2 lg:grid-cols-2";
    }
    return "md:grid-cols-1 lg:grid-cols-1";
  }, [visiblePlans.length]);

  function calculateNextBilling(interval: string, paidAt: string) {
    const paidDate = new Date(paidAt);
    if (interval === "year") {
      return new Date(
        paidDate.getTime() + 365 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString();
    }
    if (interval === "month") {
      return new Date(
        paidDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString();
    }
    return "";
  }

  const checkRecentPayment = useCallback(async (): Promise<
    "success" | "failure" | "none"
  > => {
    const paymentPending = localStorage.getItem("veo3_payment_pending");
    const paymentTimestamp = localStorage.getItem("veo3_payment_timestamp");
    if (!paymentPending || !paymentTimestamp) {
      return "none";
    }

    try {
      const response = await fetch(
        `/api/check-recent-payment?timestamp=${paymentTimestamp}`,
      );
      const result = await response.json();

      if (result.code === 0 && result.data) {
        if (result.data.hasRecentPayment) {
          const paymentInfo = result.data.paymentInfo;

          trackGAPurchase({
            transactionId:
              paymentInfo.orderNo ||
              `${paymentInfo.paidAt}:${paymentInfo.planName}:${paymentInfo.amount}`,
            itemId: paymentInfo.productId,
            itemName: paymentInfo.planName,
            amountCents: paymentInfo.amount,
            currency: paymentInfo.currency,
            interval: paymentInfo.interval,
            credits: paymentInfo.credits,
            paidAt: paymentInfo.paidAt,
          });

          if (paymentInfo.interval !== "one-time") {
            trackUetEvent(
              "subscription_purchase",
              {
                event_category: "subscription",
                event_label: paymentInfo.planName,
                event_value: paymentInfo.amount,
                revenue_value: paymentInfo.amount,
                currency: paymentInfo.currency,
              },
              {
                dedupeKey: `${paymentTimestamp}:${paymentInfo.planName}:${paymentInfo.amount}`,
                dedupeStorage: "local",
              }
            );
          }

          setSuccessInfo({
            planName: paymentInfo.planName,
            credits: paymentInfo.credits,
            nextBilling: calculateNextBilling(
              paymentInfo.interval,
              paymentInfo.paidAt,
            ),
            isMonthlyDistribution: paymentInfo.isMonthlyDistribution,
            monthlyCredits: paymentInfo.monthlyCredits,
            totalCredits: paymentInfo.totalCredits,
            remainingMonths: paymentInfo.remainingMonths,
          });

          setShowSuccessModal(true);
          localStorage.removeItem("veo3_payment_pending");
          localStorage.removeItem("veo3_payment_timestamp");
          localStorage.removeItem("veo3_payment_info");
          return "success";
        }

        if (result.data.hasFailedPayment && result.data.failureInfo) {
          const failureInfo = result.data.failureInfo;
          const message =
            failureInfo.message || failureInfo.code || "Payment failed";

          toast.error(message);
          localStorage.removeItem("veo3_payment_pending");
          localStorage.removeItem("veo3_payment_timestamp");
          localStorage.removeItem("veo3_payment_info");
          return "failure";
        }
      }
    } catch (error) {
      console.error("检查支付状态失败:", error);
    }

    return "none";
  }, []);

  // 获取支持订阅的支付方式
  useEffect(() => {
    if (!locationLoading) {
      try {
        const methods = getAvailablePaymentMethods(isRussia, true);
        setAvailableMethods(methods);

        // 根据用户位置自动选择支付方式
        if (methods.length > 0) {
          if (isRussia) {
            const firstPayssionMethod = methods.find(
              (m) => m.provider === "payssion",
            );
            if (firstPayssionMethod) {
              setSelectedPaymentMethod(firstPayssionMethod.id);
              setSelectedProvider("payssion");
            }
          } else {
            const stripeMethod = methods.find((m) => m.provider === "stripe");
            if (stripeMethod) {
              setSelectedPaymentMethod(stripeMethod.id);
              setSelectedProvider("stripe");
            } else if (methods.length > 0) {
              setSelectedPaymentMethod(methods[0].id);
              setSelectedProvider(methods[0].provider);
            }
          }
        }
      } catch (error) {
        console.error("Failed to get payment methods:", error);
        setAvailableMethods([
          {
            id: "stripe",
            name: "Credit Card",
            logo: "/payment-logos/stripe.png",
            provider: "stripe",
          },
        ]);
        setSelectedPaymentMethod("stripe");
        setSelectedProvider("stripe");
      }
    }
  }, [locationLoading, isRussia]);

  // Track pricing view when modal opens
  useEffect(() => {
    if (isOpen) {
      trackPricingView();
    }
  }, [isOpen, trackPricingView]);

  // Fetch current subscription when user is logged in and modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchCurrentSubscription();
    }
  }, [isOpen, user]);

  // 检测支付成功状态（仅用于显示成功弹窗，不再上报 Metrica）
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    checkRecentPayment();
    const handleFocus = () => {
      setTimeout(() => {
        checkRecentPayment();
      }, 1000);
    };
    window.addEventListener("focus", handleFocus);
    const intervalId = window.setInterval(() => {
      checkRecentPayment();
    }, 3000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(intervalId);
    };
  }, [isOpen, checkRecentPayment]);

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      const amount = cn_pay ? item.cn_amount : item.amount;
      trackGABeginCheckout({
        itemId: item.product_id,
        itemName: item.title || item.product_name || item.product_id,
        amountCents: amount || 0,
        currency: cn_pay ? "CNY" : item.currency,
        quantity: 1,
        interval: item.interval,
        credits: item.credits,
      });

      if (!user) {
        setShowSignModal(true);
        return;
      }

      if (isRussia && availableMethods.length > 0 && !selectedPaymentMethod) {
        toast.error(t("please_select_payment"));
        return;
      }

      // Track checkout start
      trackCheckoutStart(item.product_name || item.product_id, amount || 0);

      await processPayment(item, cn_pay);
    } catch (e) {
      console.log("checkout failed: ", e);
      toast.error("checkout failed");
    }
  };

  const handleBundlePurchase = async (bundle: BundleItem) => {
    try {
      trackGABeginCheckout({
        itemId: bundle.id,
        itemName: bundle.name,
        amountCents: bundle.amount,
        currency: "USD",
        quantity: 1,
        interval: "one-time",
        credits: bundle.credits,
      });

      if (!user) {
        setShowBundleModal(false);
        setShowSignModal(true);
        return;
      }

      // Track checkout start for bundle
      trackCheckoutStart(bundle.name, bundle.amount);

      setBundleLoading(true);

      // Generate product name based on user region
      const productName = isRussia
        ? `Seedance Пакет ${bundle.credits} кредитов`
        : bundle.name;

      // Build payment params for bundle
      const params = {
        product_id: bundle.id,
        product_name: productName,
        credits: bundle.credits,
        interval: "one-time",
        amount: bundle.amount,
        currency: "USD",
        valid_months: 1,
        payment_method: selectedPaymentMethod || "stripe",
        user_preference: selectedProvider || "stripe",
      };

      // Set payment pending marker
      const paymentTimestamp = Date.now();
      localStorage.setItem("veo3_payment_pending", "true");
      localStorage.setItem(
        "veo3_payment_timestamp",
        paymentTimestamp.toString(),
      );
      localStorage.setItem(
        "veo3_payment_info",
        JSON.stringify({
          planName: productName,
          credits: bundle.credits,
          timestamp: paymentTimestamp,
        }),
      );

      // Call payment API
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setBundleLoading(false);
        setShowBundleModal(false);
        setShowSignModal(true);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        setBundleLoading(false);
        return;
      }

      // Handle redirect
      const { redirect_url, success } = data;
      if (redirect_url) {
        window.location.href = redirect_url;
      } else if (success) {
        // Payment completed without redirect (existing mandate)
        setShowBundleModal(false);
        const status = await checkRecentPayment();
        if (status === "none") {
          window.setTimeout(() => {
            checkRecentPayment();
          }, 2000);
        }
      } else {
        toast.error("Payment link generation failed");
      }
    } catch (error) {
      console.error("Bundle purchase failed:", error);
      toast.error("Purchase failed");
    } finally {
      setBundleLoading(false);
    }
  };

  const processPayment = async (item: PricingItem, cn_pay: boolean = false) => {
    const params = {
      product_id: item.product_id,
      product_name: item.product_name,
      credits: item.credits,
      interval: item.interval,
      amount: cn_pay ? item.cn_amount : item.amount,
      currency: cn_pay ? "cny" : item.currency,
      valid_months: item.valid_months,
      payment_method: selectedPaymentMethod,
      user_preference: selectedProvider,
    };

    // 设置支付等待标记（仅用于显示成功弹窗）
    const paymentTimestamp = Date.now();
    localStorage.setItem("veo3_payment_pending", "true");
    localStorage.setItem("veo3_payment_timestamp", paymentTimestamp.toString());
    localStorage.setItem(
      "veo3_payment_info",
      JSON.stringify({
        planName: item.title || item.product_name,
        credits: item.credits,
        timestamp: paymentTimestamp,
      }),
    );

    setIsLoading(true);
    setProductId(item.product_id);

    try {
      const isSubscription =
        item.interval === "month" || item.interval === "year";
      let endpoint;

      if (
        selectedProvider === "creem" ||
        selectedPaymentMethod === "creem" ||
        selectedProvider === "stripe" ||
        selectedPaymentMethod === "stripe"
      ) {
        endpoint = "/api/subscription/create";
      } else if (
        isSubscription &&
        (selectedProvider === "payssion" ||
          ["mir", "yoomoney", "sberpay", "tbank"].includes(
            selectedPaymentMethod,
          ))
      ) {
        endpoint = "/api/subscription/create";
      } else {
        throw new Error("Unsupported payment method");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        setShowSignModal(true);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      if (
        selectedProvider === "creem" ||
        selectedPaymentMethod === "creem" ||
        selectedProvider === "stripe" ||
        selectedPaymentMethod === "stripe"
      ) {
        const { redirect_url, success, subscriptionId } = data;
        if (redirect_url) {
          window.location.href = redirect_url;
        } else if (success && subscriptionId) {
          const status = await checkRecentPayment();
          if (status === "none") {
            window.setTimeout(() => {
              checkRecentPayment();
            }, 2000);
          }
        } else {
          toast.error("Payment link generation failed");
        }
      } else {
        const { redirect_url, success, subscriptionId } = data;
        if (redirect_url) {
          window.location.href = redirect_url;
        } else if (success && subscriptionId) {
          const status = await checkRecentPayment();
          if (status === "none") {
            window.setTimeout(() => {
              checkRecentPayment();
            }, 2000);
          }
        } else {
          toast.error("Payment link generation failed");
        }
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      toast.error("Payment processing failed");
    } finally {
      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (!pricing.items?.length || hasUserSelectedGroup) {
      return;
    }

    let preferredGroup =
      selectedProvider === "creem"
        ? pricing.groups?.find((g) => g.name === "yearly")?.name
        : undefined;

    if (!preferredGroup) {
      preferredGroup = pricing.groups?.find((g) => g.name === "monthly")?.name;
    }

    const fallbackGroup =
      pricing.items?.[0]?.group || pricing.groups?.[0]?.name;
    const nextGroup = preferredGroup || fallbackGroup;

    if (nextGroup && nextGroup !== group) {
      setGroup(nextGroup);
    }
  }, [
    pricing.items,
    pricing.groups,
    selectedProvider,
    hasUserSelectedGroup,
    group,
  ]);

  if (pricing.disabled) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] sm:max-h-[85vh] overflow-y-auto p-0">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">{pricing.title}</span>
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              {pricing.description}
            </p>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="flex flex-col items-center gap-6">
              {pricing.groups && pricing.groups.length > 0 && (
                <div className="flex h-12 items-center rounded-md bg-muted p-1 text-lg">
                  <RadioGroup
                    value={group}
                    className={`h-full grid-cols-${pricing.groups.length}`}
                    onValueChange={(value) => {
                      setGroup(value);
                      setHasUserSelectedGroup(true);
                    }}
                  >
                    {pricing.groups.map((item, i) => {
                      return (
                        <div
                          key={i}
                          className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-white/80 dark:has-[button[data-state="checked"]]:bg-white'
                        >
                          <RadioGroupItem
                            value={item.name || ""}
                            id={item.name}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={item.name}
                            className="flex h-full cursor-pointer items-center justify-center px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                          >
                            {item.title}
                            {/* 为yearly添加40%折扣标签 */}
                            {item.name === "yearly" && (
                              <Badge
                                variant="outline"
                                className="border-primary bg-primary px-3 py-0.5 ml-2 text-primary-foreground text-xs font-medium whitespace-nowrap"
                              >
                                40% OFF
                              </Badge>
                            )}
                            {item.label && item.name !== "yearly" && (
                              <Badge
                                variant="outline"
                                className="border-primary bg-primary px-1.5 ml-2 text-primary-foreground"
                              >
                                {item.label}
                              </Badge>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              <div
                className={`w-full grid gap-4 grid-cols-1 ${gridColumnsClass}`}
              >
                {visiblePlans.map((item, index) => {
                  // Calculate subscription status for this item
                  const itemIsCurrentPlan = item.product_id
                    ? isCurrentPlan(item.product_id)
                    : false;
                  const itemCanUpgrade = item.product_id
                    ? canUpgradeTo(item.product_id)
                    : true;
                  const itemIsDowngrade = item.product_id
                    ? isDowngrade(item.product_id)
                    : false;
                  // Free plan (amount === 0) is always purchasable
                  const isFreeItem = item.amount === 0;
                  const isMaxItem = item.product_id?.startsWith("max-");

                  const titlePriceBlock = (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {item.title && (
                          <h3 className="text-lg font-semibold">
                            {item.title}
                          </h3>
                        )}
                        <div className={isMaxItem ? "" : "flex-1"}></div>
                        {itemIsCurrentPlan && (
                          <Badge
                            variant="outline"
                            className="border-green-500 bg-green-500 px-1.5 text-white text-xs"
                          >
                            Current Plan
                          </Badge>
                        )}
                        {item.label && !itemIsCurrentPlan && (
                          <Badge
                            variant="outline"
                            className="border-primary bg-primary px-1.5 text-primary-foreground text-xs"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </div>
                      {isMaxItem && item.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-end gap-2 mb-3">
                        {item.original_price && (
                          <span
                            className={`${
                              isMaxItem ? "text-sm" : "text-lg"
                            } text-muted-foreground font-semibold line-through`}
                          >
                            {item.original_price}
                          </span>
                        )}
                        {item.price && (
                          <span
                            className={`${
                              isMaxItem ? "text-2xl" : "text-3xl"
                            } font-semibold`}
                          >
                            {item.price}
                          </span>
                        )}
                        {item.unit && (
                          <span className="block font-semibold text-sm">
                            {item.unit}
                          </span>
                        )}
                      </div>
                      {!isMaxItem && item.description && (
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  );

                  const featuresBlock = (
                    <div>
                      {item.features_title && (
                        <p
                          className={`mb-2 font-semibold text-sm ${
                            isMaxItem ? "" : "mt-4"
                          }`}
                        >
                          {item.features_title}
                        </p>
                      )}
                      {item.features && (
                        <ul className="flex flex-col gap-1.5">
                          {item.features.map((feature, fi) => {
                            return (
                              <li
                                className="flex gap-2 text-sm"
                                key={`feature-${fi}`}
                              >
                                <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                                <p>
                                  <HighlightFeature feature={feature} />
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );

                  const buttonsBlock = (
                    <div className="flex flex-col gap-2">
                      {item.cn_amount && item.cn_amount > 0 ? (
                        <div className="flex items-center gap-x-2 mt-2">
                          <span className="text-sm">人民币支付 👉</span>
                          <div
                            className="inline-block p-2 hover:cursor-pointer hover:bg-base-200 rounded-md"
                            onClick={() => {
                              if (isLoading) {
                                return;
                              }
                              handleCheckout(item, true);
                            }}
                          >
                            <img
                              src="/imgs/cnpay.png"
                              alt="cnpay"
                              className="w-15 h-10 rounded-lg"
                            />
                          </div>
                        </div>
                      ) : null}

                      {item.button && (
                        <div className="space-y-3">
                          {isRussia &&
                            availableMethods.length > 0 &&
                            item.amount > 0 && (
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {t("select_payment_method")}
                                    {!selectedPaymentMethod && (
                                      <span className="text-red-500"> *</span>
                                    )}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {availableMethods
                                    .filter((m) => m.provider === "payssion")
                                    .map((method) => (
                                      <div
                                        key={method.id}
                                        className={`flex cursor-pointer items-center gap-x-3 rounded-lg border-2 p-2 transition-all duration-200 h-14 ${
                                          selectedPaymentMethod === method.id
                                            ? "border-primary bg-primary/10"
                                            : "border-gray-200/80 bg-card dark:border-gray-600/50 hover:border-primary/50"
                                        }`}
                                        onClick={() => {
                                          setSelectedPaymentMethod(method.id);
                                          setSelectedProvider(method.provider);
                                        }}
                                      >
                                        <div
                                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                                            selectedPaymentMethod === method.id
                                              ? "border-primary"
                                              : "border-gray-400"
                                          }`}
                                        >
                                          {selectedPaymentMethod ===
                                            method.id && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                                          )}
                                        </div>
                                        <div className="flex flex-1 items-center justify-center rounded-md bg-white p-1">
                                          <img
                                            src={method.logo}
                                            alt={method.name}
                                            className="h-8 w-auto object-contain"
                                            onError={(e) => {
                                              (
                                                e.target as HTMLImageElement
                                              ).style.display = "none";
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                          {/* Buy Credits Button */}
                          {item.amount > 0 &&
                            subscriptionState?.hasActiveSubscription && (
                              <Button
                                variant="outline"
                                className="w-full bg-white text-primary border-primary hover:bg-primary/5"
                                onClick={() => setShowBundleModal(true)}
                              >
                                {tBundle("buyCredits")}
                              </Button>
                            )}

                          <Button
                            className={`w-full flex items-center justify-center gap-2 font-semibold relative overflow-hidden group transition-transform duration-200 ease-out ${
                              itemIsCurrentPlan || itemIsDowngrade
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                            disabled={
                              isLoading ||
                              item.button.disabled ||
                              itemIsCurrentPlan ||
                              (!isFreeItem && itemIsDowngrade)
                            }
                            onClick={() => {
                              if (item.amount === 0 && item.button.url) {
                                window.location.href = "/";
                                return;
                              }

                              // Block if current plan or downgrade
                              if (itemIsCurrentPlan) {
                                return;
                              }
                              if (itemIsDowngrade) {
                                toast.error(
                                  "Downgrade is not allowed. Please contact support if you need to change your plan.",
                                );
                                return;
                              }

                              sendGAEvent(
                                "event",
                                "conversion_event_begin_checkout",
                                {
                                  value: item.credits === 12 ? 100 : 10,
                                  currency: item.currency,
                                  items: [
                                    {
                                      item_name: item.title,
                                      item_id: item.product_id,
                                      item_price: item.price,
                                      item_quantity: item.credits,
                                      item_amount: item.amount,
                                    },
                                  ],
                                },
                              );
                              if (isLoading) {
                                return;
                              }
                              handleCheckout(item);
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {(!isLoading ||
                              (isLoading &&
                                productId !== item.product_id)) && (
                              <span className="relative z-10">
                                {itemIsCurrentPlan
                                  ? "Current Plan"
                                  : itemIsDowngrade
                                    ? "Downgrade Not Allowed"
                                    : itemCanUpgrade &&
                                        subscriptionState?.hasActiveSubscription
                                      ? "Upgrade"
                                      : item.button.title}
                              </span>
                            )}

                            {isLoading && productId === item.product_id && (
                              <>
                                <span className="relative z-10">
                                  {item.button.title}
                                </span>
                                <Loader className="relative z-10 ml-2 h-4 w-4 animate-spin" />
                              </>
                            )}
                            {item.button.icon &&
                              !itemIsCurrentPlan &&
                              !itemIsDowngrade && (
                                <Icon
                                  name={item.button.icon}
                                  className="relative z-10 size-4"
                                />
                              )}
                          </Button>
                        </div>
                      )}

                      {item.tip && (
                        <p className="text-muted-foreground text-sm mt-2 text-center">
                          {item.tip}
                        </p>
                      )}
                    </div>
                  );

                  return (
                    <div
                      key={item.product_id ?? index}
                      className={`rounded-lg p-4 ${
                        isMaxItem ? "lg:col-span-3 lg:py-8" : ""
                      } ${
                        item.is_featured
                          ? "border-primary border-2 bg-card text-card-foreground"
                          : "border-muted border"
                      }`}
                    >
                      {isMaxItem ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-center">
                          {titlePriceBlock}
                          {featuresBlock}
                          <div className="w-full lg:max-w-72 lg:ml-auto">
                            {buttonsBlock}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col justify-between gap-4">
                          <div>
                            {titlePriceBlock}
                            {featuresBlock}
                          </div>
                          {buttonsBlock}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 支付成功弹窗 */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="sm:max-w-md z-[10000]"
          overlayClassName="z-[10000]"
        >
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              <span className="text-2xl">🎉</span>
              {t("payment_successful")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-green-600">
                {successInfo.planName} {t("plan_activated")}
              </p>

              {/* Monthly distribution - show first month credits */}
              {successInfo.isMonthlyDistribution &&
                successInfo.monthlyCredits && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {successInfo.monthlyCredits} {t("credits_added")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("monthly_credits_grant", {
                        credits: successInfo.monthlyCredits,
                      })}
                    </p>
                  </div>
                )}

              {/* Regular credits display (backward compatible) */}
              {!successInfo.isMonthlyDistribution &&
                successInfo.credits &&
                successInfo.credits > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {successInfo.credits} {t("credits_added")}
                  </p>
                )}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  window.location.reload();
                }}
              >
                {t("continue")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  window.location.href = "/";
                }}
              >
                {t("start_creating")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credits Bundle Modal */}
      <CreditsBundleModal
        isOpen={showBundleModal}
        onClose={() => setShowBundleModal(false)}
        onPurchase={handleBundlePurchase}
        isLoading={bundleLoading}
      />
    </>
  );
}
