// 增强版定价组件 - 支持多支付方式

"use client";

import { Check, Loader, CreditCard, Globe } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import {
  PaymentMethodSelector,
  PaymentMethodConfig,
} from "@/components/ui/payment-method-selector";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EnhancedPricingProps {
  pricing: PricingType;
}

export default function EnhancedPricing({ pricing }: EnhancedPricingProps) {
  if (pricing.disabled) {
    return null;
  }

  const { user, setShowSignModal } = useAppContext();
  const { location, loading: locationLoading, isRussia } = useGeolocation();

  const [group, setGroup] = useState(pricing.groups?.[0]?.name);
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PricingItem | null>(null);
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodConfig[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");

  // 获取可用支付方式
  useEffect(() => {
    if (!locationLoading && location.detected) {
      fetchPaymentMethods();
    }
  }, [location, locationLoading]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          countryCode: location.countryCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableMethods(data.data.methods || []);

        // 自动选择推荐的支付方式
        if (data.data.methods && data.data.methods.length > 0) {
          const recommended = data.data.recommendation;
          setSelectedProvider(recommended.provider);

          const firstMethod = data.data.methods.find(
            (m: PaymentMethodConfig) => m.provider === recommended.provider
          );
          if (firstMethod) {
            setSelectedPaymentMethod(firstMethod.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      // 设置默认的支付方式
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
  };

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      // 如果是俄罗斯且有多种支付方式，显示支付方式选择器
      if (isRussia && availableMethods.length > 1 && !selectedPaymentMethod) {
        setSelectedItem(item);
        setShowPaymentMethods(true);
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

    setIsLoading(true);
    setProductId(item.product_id);

    try {
      // 根据选择的支付方式决定使用哪个API端点
      const endpoint =
        selectedPaymentMethod === "stripe"
          ? "/api/checkout"
          : "/api/checkout/payssion";

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

      if (selectedPaymentMethod === "stripe") {
        // Stripe 支付流程
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
        // Payssion 支付流程
        const { redirect_url } = data;
        if (redirect_url) {
          window.location.href = redirect_url;
        } else {
          toast.error("支付链接生成失败");
        }
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      toast.error("支付处理失败");
    } finally {
      setIsLoading(false);
      setProductId(null);
      setShowPaymentMethods(false);
    }
  };

  const handlePaymentMethodConfirm = () => {
    if (selectedItem) {
      processPayment(selectedItem);
    }
  };

  useEffect(() => {
    if (pricing.items) {
      const yearlyGroup = pricing.groups?.find((g) => g.name === "yearly");
      const defaultGroup = yearlyGroup
        ? "yearly"
        : pricing.items[0].group || pricing.groups?.[0]?.name;
      setGroup(defaultGroup);
      setProductId(pricing.items[0].product_id);
      setIsLoading(false);
    }
  }, [pricing.items]);

  return (
    <>
      <section id={pricing.name} className="py-16">
        <div className="container">
          <div className="mx-auto mb-12 text-center">
            <h2 className="mb-4 text-4xl font-semibold lg:text-5xl">
              {pricing.title}
            </h2>
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
              className={`md:min-w-96 mt-0 grid gap-6 md:grid-cols-${
                pricing.items?.filter(
                  (item) => !item.group || item.group === group
                )?.length
              }`}
            >
              {pricing.items?.map((item, index) => {
                if (item.group && item.group !== group) {
                  return null;
                }

                return (
                  <div
                    key={index}
                    className={`rounded-lg p-6 ${
                      item.is_featured
                        ? "border-primary border-2 bg-card text-card-foreground"
                        : "border-muted border"
                    }`}
                  >
                    <div className="flex h-full flex-col justify-between gap-5">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          {item.title && (
                            <h3 className="text-xl font-semibold">
                              {item.title}
                            </h3>
                          )}
                          <div className="flex-1"></div>
                          {item.label && (
                            <Badge
                              variant="outline"
                              className="border-primary bg-primary px-1.5 text-primary-foreground"
                            >
                              {item.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                          {item.original_price && (
                            <span className="text-xl text-muted-foreground font-semibold line-through">
                              {item.original_price}
                            </span>
                          )}
                          {item.price && (
                            <span className="text-5xl font-semibold">
                              {item.price}
                            </span>
                          )}
                          {item.unit && (
                            <span className="block font-semibold">
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
                          <p className="mb-3 mt-6 font-semibold">
                            {item.features_title}
                          </p>
                        )}
                        {item.features && (
                          <ul className="flex flex-col gap-3">
                            {item.features.map((feature, fi) => {
                              return (
                                <li
                                  className="flex gap-2"
                                  key={`feature-${fi}`}
                                >
                                  <Check className="mt-1 size-4 shrink-0" />
                                  {feature}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

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
                          <div className="space-y-3">
                            {/* 优雅的支付方式展示 */}
                            {isRussia && availableMethods.length > 1 && (
                              <div className="space-y-2">
                                <div className="text-center">
                                  <span className="text-xs text-muted-foreground/80 font-medium tracking-wide">
                                    Поддерживаемые способы оплаты
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                  {availableMethods
                                    .filter((m) => m.provider === "payssion")
                                    .slice(0, 3)
                                    .map((method, index) => (
                                      <div
                                        key={method.id}
                                        className="relative group"
                                      >
                                        <div className="flex items-center justify-center w-12 h-8 bg-white dark:bg-white/95 rounded-md shadow-sm border border-gray-200/50 dark:border-gray-300/20 hover:shadow-md hover:scale-105 transition-all duration-200">
                                          <img
                                            src={method.logo}
                                            alt={method.name}
                                            className="h-5 w-auto object-contain"
                                            onError={(e) => {
                                              (
                                                e.target as HTMLImageElement
                                              ).style.display = "none";
                                            }}
                                          />
                                        </div>
                                        {/* Tooltip on hover */}
                                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                          {method.name}
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
                              {/* 微妙的背景动效 */}
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
      </section>

      {/* 支付方式选择对话框 */}
      <Dialog open={showPaymentMethods} onOpenChange={setShowPaymentMethods}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择支付方式</DialogTitle>
          </DialogHeader>

          <PaymentMethodSelector
            methods={availableMethods}
            selectedMethod={selectedPaymentMethod}
            onMethodChange={setSelectedPaymentMethod}
            userLocation={location}
            allowProviderSwitch={true}
            onProviderSwitch={setSelectedProvider}
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPaymentMethods(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handlePaymentMethodConfirm}
              disabled={!selectedPaymentMethod}
              className="flex-1"
            >
              确认支付
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
