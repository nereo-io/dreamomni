// 增强版定价组件 - 支持多支付方式

"use client";

import { Check, Loader } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import HighlightFeature from "./highlight-feature";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import CreditsBundleModal, {
  BundleItem,
} from "@/components/ui/credits-bundle-modal";
import { useTranslations } from "next-intl";
import useCurrentSubscription from "@/hooks/useCurrentSubscription";
import { trackUetEvent } from "@/lib/bing-uet";
import {
  trackGABeginCheckout,
  trackGAPurchase,
} from "@/services/analytics/google-tracking";

interface EnhancedPricingProps {
  pricing: PricingType;
}

function resolveBonusPlanLabels(items?: PricingItem[]) {
  const findLabel = (
    prefix: "mini" | "standard" | "plus" | "max",
    fallback: string,
  ) =>
    items?.find((item) => item.product_id?.startsWith(`${prefix}-`) && item.title)
      ?.title || fallback;

  return {
    mini: findLabel("mini", "Mini Plan"),
    standard: findLabel("standard", "Standard Plan"),
    plus: findLabel("plus", "Plus Plan"),
    max: findLabel("max", "Max Plan"),
  };
}

export default function EnhancedPricing({ pricing }: EnhancedPricingProps) {
  const { user, setShowSignModal } = useAppContext();
  const { loading: locationLoading, isRussia } = useGeolocation();
  const { trackPricingView, trackCheckoutStart } =
    useYandexTracking();
  const t = useTranslations("creditsBundle");
  const tPricing = useTranslations("pricing_modal");
  const {
    subscriptionState,
    isLoading: subscriptionLoading,
    fetchCurrentSubscription,
    canUpgradeTo,
    isCurrentPlan,
    isDowngrade,
  } = useCurrentSubscription();

  const [group, setGroup] = useState("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodConfig[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
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
      if (item.group && item.group !== group) {
        return false;
      }
      if (item.amount === 0 || item.product_id === "free-plan") {
        return false;
      }
      return true;
    });
  }, [pricing.items, group]);
  const bonusPlanLabels = useMemo(
    () => resolveBonusPlanLabels(pricing.items),
    [pricing.items],
  );

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
    const paymentPending = localStorage.getItem("dreamomni_payment_pending");
    const paymentTimestamp = localStorage.getItem("dreamomni_payment_timestamp");
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
          localStorage.removeItem("dreamomni_payment_pending");
          localStorage.removeItem("dreamomni_payment_timestamp");
          localStorage.removeItem("dreamomni_payment_info");
          return "success";
        }

        if (result.data.hasFailedPayment && result.data.failureInfo) {
          const failureInfo = result.data.failureInfo;
          const message =
            failureInfo.message || failureInfo.code || "Payment failed";

          toast.error(message);
          localStorage.removeItem("dreamomni_payment_pending");
          localStorage.removeItem("dreamomni_payment_timestamp");
          localStorage.removeItem("dreamomni_payment_info");
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
        const methods = getAvailablePaymentMethods(isRussia, true); // 第二个参数表示只获取支持订阅的支付方式
        setAvailableMethods(methods);

        // 根据用户位置自动选择支付方式
        if (methods.length > 0) {
          if (isRussia) {
            // 俄罗斯用户: 默认选择第一个 Payssion 支付方式（按顺序 sberpay -> yoomoney -> mir）
            const firstPayssionMethod = methods.find(
              (m) => m.provider === "payssion",
            );
            if (firstPayssionMethod) {
              setSelectedPaymentMethod(firstPayssionMethod.id);
              setSelectedProvider("payssion");
            }
          } else {
            // 非俄罗斯用户: 默认选择 Stripe
            const stripeMethod = methods.find((m) => m.provider === "stripe");
            if (stripeMethod) {
              setSelectedPaymentMethod(stripeMethod.id);
              setSelectedProvider("stripe");
            } else if (methods.length > 0) {
              // Fallback: 如果没有Stripe，选择列表中的第一个
              setSelectedPaymentMethod(methods[0].id);
              setSelectedProvider(methods[0].provider);
            }
          }
        }
      } catch (error) {
        console.error("Failed to get payment methods:", error);
        // 设置默认的支付方式
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

  // Track pricing view when component mounts
  useEffect(() => {
    trackPricingView();
  }, []);

  // Fetch current subscription when user is logged in
  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  // 检测支付成功状态（仅用于显示成功弹窗，不再上报 Metrica）
  useEffect(() => {
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
  }, [checkRecentPayment]);

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

      // 如果是俄罗斯用户但没有选择支付方式，提示用户选择
      if (isRussia && availableMethods.length > 0 && !selectedPaymentMethod) {
        toast.error("Пожалуйста, выберите способ оплаты");
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
        ? `DreamOmni Пакет ${bundle.credits} кредитов`
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
      localStorage.setItem("dreamomni_payment_pending", "true");
      localStorage.setItem(
        "dreamomni_payment_timestamp",
        paymentTimestamp.toString(),
      );
      localStorage.setItem(
        "dreamomni_payment_info",
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
    localStorage.setItem("dreamomni_payment_pending", "true");
    localStorage.setItem("dreamomni_payment_timestamp", paymentTimestamp.toString());
    localStorage.setItem(
      "dreamomni_payment_info",
      JSON.stringify({
        planName: item.title || item.product_name,
        credits: item.credits,
        timestamp: paymentTimestamp,
      }),
    );

    setIsLoading(true);
    setProductId(item.product_id);

    try {
      // 调试信息
      console.log("Payment Debug Info:", {
        isRussia,
        selectedPaymentMethod,
        selectedProvider,
        availableMethods,
      });

      // 根据支付方式和订阅类型决定使用哪个API端点
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
        // Payssion V2 订阅
        endpoint = "/api/subscription/create";
      } else {
        // 其他支付方式
        throw new Error("Unsupported payment method");
      }

      console.log("Using endpoint:", endpoint);

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
        // Card payment flow
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
        // Payssion 支付流程
        const { redirect_url, success, subscriptionId } = data;
        if (redirect_url) {
          // 需要用户授权，跳转到授权页面
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

  if (pricing.disabled) {
    return null;
  }

  return (
    <>
      <section id={pricing.name} className="py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="mx-auto mb-12 text-center">
            <h1 className="mb-4 text-4xl font-semibold lg:text-5xl">
              {pricing.title}
            </h1>
            <p className="text-muted-foreground lg:text-lg">
              {pricing.description}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {pricing.groups && pricing.groups.length > 0 && (
              <div className="flex h-12 mb-12 items-center rounded-md bg-muted p-1 text-lg">
                <RadioGroup
                  value={group}
                  className={`h-full grid-cols-${pricing.groups.length}`}
                  onValueChange={(value) => {
                    setGroup(value);
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
                              className="border-primary bg-primary px-2 py-0.5 ml-2 text-primary-foreground text-xs font-medium"
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
              className="md:min-w-96 mt-0 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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
                    <div
                      className={`flex items-center gap-2 ${
                        isMaxItem ? "mb-1" : "mb-3"
                      }`}
                    >
                      {item.title && (
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      )}
                      <div className={isMaxItem ? "" : "flex-1"}></div>
                      {itemIsCurrentPlan && (
                        <Badge
                          variant="outline"
                          className="border-green-500 bg-green-500 px-1.5 text-white"
                        >
                          Current Plan
                        </Badge>
                      )}
                      {item.label && !itemIsCurrentPlan && (
                        <Badge
                          variant="outline"
                          className="border-primary bg-primary px-1.5 text-primary-foreground"
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
                    <div className="flex items-end gap-2 mb-4">
                      {item.original_price && (
                        <span className="text-base text-muted-foreground font-semibold line-through">
                          {item.original_price}
                        </span>
                      )}
                      {item.price && (
                        <span className="text-3xl font-semibold">
                          {item.price}
                        </span>
                      )}
                      {item.unit && (
                        <span className="block font-semibold">
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
                        className={`mb-3 font-semibold ${
                          isMaxItem ? "" : "mt-6"
                        }`}
                      >
                        {item.features_title}
                      </p>
                    )}
                    {item.features && (
                      <ul className="flex flex-col gap-3">
                        {item.features.map((feature, fi) => {
                          return (
                            <li
                              className="flex gap-2 text-sm"
                              key={`feature-${fi}`}
                            >
                              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
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
                        {/* 中国支付 */}
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

                        {/* 主要支付按钮 */}
                        {item.button && (
                          <div>
                            {/* 支付方式选择器 */}
                            {isRussia &&
                              availableMethods.length > 0 &&
                              item.amount > 0 && (
                                <div className="space-y-3 mb-3">
                                  <div>
                                    <span className="text-sm text-muted-foreground">
                                      Выберите способ оплаты
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
                                          onClick={() =>
                                            setSelectedPaymentMethod(method.id)
                                          }
                                        >
                                          <div
                                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                                              selectedPaymentMethod ===
                                              method.id
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
                                  className="w-full mb-3 bg-white text-primary border-primary hover:bg-primary/5"
                                  onClick={() => setShowBundleModal(true)}
                                >
                                  {t("buyCredits")}
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
                                // Handle Free Plan navigation
                                if (item.amount === 0 && item.button.url) {
                                  // Navigate to homepage for free plan
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
                              {/* 微妙的背景动效 */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                    key={index}
                    className={`rounded-lg p-5 ${
                      isMaxItem ? "lg:col-span-3 lg:py-8" : "lg:w-96"
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
                      <div className="flex h-full flex-col justify-between gap-5">
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
      </section>

      {/* 支付成功弹窗 */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              <span className="text-2xl">🎉</span>
              {tPricing("payment_successful")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-green-600">
                {successInfo.planName} {tPricing("plan_activated")}
              </p>

              {/* Monthly distribution - show first month credits */}
              {successInfo.isMonthlyDistribution &&
                successInfo.monthlyCredits && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      {successInfo.monthlyCredits} {tPricing("credits_added")}
                    </p>
                    <p className="opacity-50">
                      {tPricing("monthly_credits_grant", {
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
                    {successInfo.credits} {tPricing("credits_added")}
                  </p>
                )}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.reload(); // 刷新页面显示最新状态
                }}
              >
                {tPricing("continue")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = "/"; // 跳转到首页开始使用
                }}
              >
                {tPricing("start_creating")}
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
        bonusPlanLabels={bonusPlanLabels}
      />
    </>
  );
}
