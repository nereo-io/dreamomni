"use client";

import { Check, Loader, Crown } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
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
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { PaymentMethodConfig } from "@/components/ui/payment-method-selector";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getAvailablePaymentMethods } from "@/lib/payment-methods";

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
  const { location, loading: locationLoading, isRussia } = useGeolocation();

  const [group, setGroup] = useState(pricing.groups?.[0]?.name);
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodConfig[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    planName?: string;
    credits?: number;
    nextBilling?: string;
  }>({});

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
              (m) => m.provider === "payssion"
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
            description: "国际信用卡和借记卡",
            logo: "/payment-logos/stripe.png",
            provider: "stripe",
            supportedCountries: ["*"],
            feeInfo: "2.9% + $0.30",
            processingTime: "即时到账",
          },
        ]);
        setSelectedPaymentMethod("stripe");
        setSelectedProvider("stripe");
      }
    }
  }, [locationLoading, isRussia]);

  // 检测支付成功状态
  useEffect(() => {
    const checkRecentPayment = async () => {
      const paymentPending = localStorage.getItem("veo3_payment_pending");
      if (!paymentPending) return;

      try {
        const response = await fetch("/api/check-recent-payment");
        const result = await response.json();

        if (result.code === 0 && result.data.hasRecentPayment) {
          const paymentInfo = result.data.paymentInfo;

          setSuccessInfo({
            planName: paymentInfo.planName,
            credits: paymentInfo.credits,
            nextBilling: calculateNextBilling(
              paymentInfo.interval,
              paymentInfo.paidAt
            ),
          });

          setShowSuccessModal(true);
          localStorage.removeItem("veo3_payment_pending");
          localStorage.removeItem("veo3_payment_info");
        }
      } catch (error) {
        console.error("检查支付状态失败:", error);
      }
    };

    if (isOpen) {
      checkRecentPayment();
      const handleFocus = () => {
        setTimeout(checkRecentPayment, 1000);
      };
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [isOpen]);

  const calculateNextBilling = (interval: string, paidAt: string) => {
    const paidDate = new Date(paidAt);
    if (interval === "year") {
      return new Date(
        paidDate.getTime() + 365 * 24 * 60 * 60 * 1000
      ).toLocaleDateString();
    } else if (interval === "month") {
      return new Date(
        paidDate.getTime() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString();
    }
    return "";
  };

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      if (isRussia && availableMethods.length > 0 && !selectedPaymentMethod) {
        toast.error("Пожалуйста, выберите способ оплаты");
        return;
      }

      await processPayment(item, cn_pay);
    } catch (e) {
      console.log("checkout failed: ", e);
      toast.error("checkout failed");
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

    localStorage.setItem("veo3_payment_pending", "true");
    localStorage.setItem(
      "veo3_payment_info",
      JSON.stringify({
        planName: item.title || item.product_name,
        credits: item.credits,
        timestamp: Date.now(),
      })
    );

    setIsLoading(true);
    setProductId(item.product_id);

    try {
      const isSubscription =
        item.interval === "month" || item.interval === "year";
      let endpoint;

      if (selectedProvider === "stripe" || selectedPaymentMethod === "stripe") {
        endpoint = "/api/checkout";
      } else if (
        isSubscription &&
        (selectedProvider === "payssion" ||
          ["mir", "yoomoney", "sberpay", "tbank"].includes(
            selectedPaymentMethod
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

      if (selectedProvider === "stripe" || selectedPaymentMethod === "stripe") {
        const { public_key, session_id } = data;
        const stripe = await loadStripe(public_key);
        if (!stripe) {
          toast.error("checkout failed");
          return;
        }

        const result = await stripe.redirectToCheckout({
          sessionId: session_id,
        });

        if (result.error) {
          toast.error(result.error.message);
        }
      } else {
        const { redirect_url, success, subscriptionId } = data;
        if (redirect_url) {
          window.location.href = redirect_url;
        } else if (success && subscriptionId) {
          const paymentInfo = localStorage.getItem("veo3_payment_info");
          if (paymentInfo) {
            const info = JSON.parse(paymentInfo);
            setSuccessInfo({
              planName: info.planName,
              credits: info.credits,
              nextBilling:
                item.interval === "year"
                  ? new Date(
                      Date.now() + 365 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()
                  : new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString(),
            });
            localStorage.removeItem("veo3_payment_pending");
            localStorage.removeItem("veo3_payment_info");
          }
          setShowSuccessModal(true);
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
    if (pricing.items) {
      const yearlyGroup = pricing.groups?.find((g) => g.name === "yearly");
      const defaultGroup = yearlyGroup
        ? "yearly"
        : pricing.items[0].group || pricing.groups?.[0]?.name;
      setGroup(defaultGroup);
    }
  }, [pricing.items]);

  if (pricing.disabled) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-0">
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
                    }}
                  >
                    {pricing.groups.map((item, i) => {
                      return (
                        <div
                          key={i}
                          className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-white'
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
                            {item.label && (
                              <Badge
                                variant="outline"
                                className="border-primary bg-primary px-1.5 ml-1 text-primary-foreground"
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
                className={`w-full grid gap-4 lg:grid-cols-2 md:grid-cols-2 grid-cols-1`}
              >
                {pricing.items?.map((item, index) => {
                  if (item.group && item.group !== group) {
                    return null;
                  }

                  // 隐藏免费计划以节省空间
                  if (item.amount === 0 || item.product_id === "free-plan") {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        item.is_featured
                          ? "border-primary border-2 bg-card text-card-foreground"
                          : "border-muted border"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            {item.title && (
                              <h3 className="text-lg font-semibold">
                                {item.title}
                              </h3>
                            )}
                            <div className="flex-1"></div>
                            {item.label && (
                              <Badge
                                variant="outline"
                                className="border-primary bg-primary px-1.5 text-primary-foreground text-xs"
                              >
                                {item.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-end gap-2 mb-3">
                            {item.original_price && (
                              <span className="text-lg text-muted-foreground font-semibold line-through">
                                {item.original_price}
                              </span>
                            )}
                            {item.price && (
                              <span className="text-3xl font-semibold">
                                {item.price}
                              </span>
                            )}
                            {item.unit && (
                              <span className="block font-semibold text-sm">
                                {item.unit}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          {item.features_title && (
                            <p className="mb-2 mt-4 font-semibold text-sm">
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
                                    <Check className="mt-0.5 size-3 shrink-0" />
                                    {feature}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

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
                                        Выберите способ оплаты
                                        {!selectedPaymentMethod && (
                                          <span className="text-red-500">
                                            {" "}
                                            *
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {availableMethods
                                        .filter(
                                          (m) => m.provider === "payssion"
                                        )
                                        .map((method) => (
                                          <div
                                            key={method.id}
                                            className={`flex cursor-pointer items-center gap-x-3 rounded-lg border-2 p-2 transition-all duration-200 h-14 ${
                                              selectedPaymentMethod ===
                                              method.id
                                                ? "border-primary bg-primary/10"
                                                : "border-gray-200/80 bg-card dark:border-gray-600/50 hover:border-primary/50"
                                            }`}
                                            onClick={() =>
                                              setSelectedPaymentMethod(
                                                method.id
                                              )
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

                              <Button
                                className="w-full flex items-center justify-center gap-2 font-semibold relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out"
                                disabled={isLoading || item.button.disabled}
                                onClick={() => {
                                  if (item.amount === 0 && item.button.url) {
                                    window.location.href = "/";
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
                                    }
                                  );
                                  if (isLoading) {
                                    return;
                                  }
                                  handleCheckout(item);
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {(!isLoading ||
                                  (isLoading &&
                                    productId !== item.product_id)) && (
                                  <span className="relative z-10">
                                    {item.button.title}
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
                                {item.button.icon && (
                                  <Icon
                                    name={item.button.icon}
                                    className="relative z-10 size-4"
                                  />
                                )}
                              </Button>
                            </div>
                          )}

                          {item.tip && (
                            <p className="text-muted-foreground text-sm mt-2">
                              {item.tip}
                            </p>
                          )}
                        </div>
                      </div>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              <span className="text-2xl">🎉</span>
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-green-600">
                {successInfo.planName} Activated
              </p>
              {successInfo.credits && successInfo.credits > 0 && (
                <p className="text-sm text-muted-foreground">
                  {successInfo.credits} credits added to your account
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
                Continue
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
                Start Creating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
