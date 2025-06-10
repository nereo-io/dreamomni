// 支付方式选择器组件

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, Globe, CreditCard, Wallet, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  provider: string;
  supportedCountries: string[];
  feeInfo?: string;
  processingTime?: string;
  pmId?: string;
}

export interface PaymentMethodSelectorProps {
  methods: PaymentMethodConfig[];
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
  userLocation?: {
    country: string;
    countryCode: string;
  };
  allowProviderSwitch?: boolean;
  onProviderSwitch?: (provider: string) => void;
  className?: string;
}

export function PaymentMethodSelector({
  methods,
  selectedMethod,
  onMethodChange,
  userLocation,
  allowProviderSwitch = true,
  onProviderSwitch,
  className,
}: PaymentMethodSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  useEffect(() => {
    // 自动选择推荐的支付提供商
    if (methods.length > 0 && !selectedProvider) {
      const recommendedProvider = userLocation?.countryCode === 'RU' ? 'payssion' : 'stripe';
      const availableProvider = methods.find(m => m.provider === recommendedProvider)?.provider || methods[0].provider;
      setSelectedProvider(availableProvider);
    }
  }, [methods, userLocation, selectedProvider]);

  // 按提供商分组支付方式
  const methodsByProvider = methods.reduce((acc, method) => {
    if (!acc[method.provider]) {
      acc[method.provider] = [];
    }
    acc[method.provider].push(method);
    return acc;
  }, {} as Record<string, PaymentMethodConfig[]>);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    onProviderSwitch?.(provider);
    
    // 自动选择该提供商的第一个支付方式
    const firstMethod = methodsByProvider[provider]?.[0];
    if (firstMethod) {
      onMethodChange(firstMethod.id);
    }
  };

  const currentMethods = selectedProvider ? methodsByProvider[selectedProvider] || [] : methods;

  return (
    <div className={cn("space-y-6", className)}>
      {/* 位置信息显示 */}
      {userLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>检测到您的位置：{userLocation.country}</span>
        </div>
      )}

      {/* 支付提供商选择 */}
      {allowProviderSwitch && Object.keys(methodsByProvider).length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">选择支付方式类型</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(methodsByProvider).map((provider) => {
              const isRecommended = 
                (provider === 'payssion' && userLocation?.countryCode === 'RU') ||
                (provider === 'stripe' && userLocation?.countryCode !== 'RU');

              return (
                <Card
                  key={provider}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedProvider === provider && "ring-2 ring-primary"
                  )}
                  onClick={() => handleProviderChange(provider)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {provider === 'stripe' ? (
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Wallet className="h-6 w-6 text-green-600" />
                        )}
                        <div>
                          <h4 className="font-medium">
                            {provider === 'stripe' ? '国际支付' : '本地支付'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {provider === 'stripe' 
                              ? '信用卡和借记卡' 
                              : '本地银行和电子钱包'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            推荐
                          </Badge>
                        )}
                        {selectedProvider === provider && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 具体支付方式选择 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">选择支付方式</h3>
        <RadioGroup
          value={selectedMethod}
          onValueChange={onMethodChange}
          className="space-y-3"
        >
          {currentMethods.map((method) => (
            <div key={method.id}>
              <RadioGroupItem
                value={method.id}
                id={method.id}
                className="peer sr-only"
              />
              <Label htmlFor={method.id} className="cursor-pointer">
                <Card className="transition-all hover:shadow-md peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 支付方式图标 */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // 图标加载失败时的备选方案
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = method.name.charAt(0).toUpperCase();
                                parent.className += ' text-xs font-bold text-gray-600';
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* 支付方式信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{method.name}</h4>
                          {method.supportedCountries.includes(userLocation?.countryCode || '') && (
                            <Badge variant="outline" className="text-xs">
                              本地支持
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {method.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {method.feeInfo && (
                            <span>费率: {method.feeInfo}</span>
                          )}
                          {method.processingTime && (
                            <span>到账: {method.processingTime}</span>
                          )}
                        </div>
                      </div>

                      {/* 选中状态 */}
                      <div className="flex-shrink-0">
                        {selectedMethod === method.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* 支付安全提示 */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p>所有支付都通过安全加密连接处理。</p>
            <p>我们不会存储您的支付信息。</p>
          </div>
        </div>
      </div>
    </div>
  );
}