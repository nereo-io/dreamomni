// 支付提供商基类和工具函数

import { PaymentProvider, PaymentError, PaymentProviderType } from './types';

/**
 * 支付提供商基类
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  abstract name: string;
  
  protected validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new PaymentError(
        'INVALID_AMOUNT',
        'Payment amount must be greater than 0',
        this.name
      );
    }
  }
  
  protected validateCurrency(currency: string): void {
    const supportedCurrencies = ['USD', 'EUR', 'CNY', 'RUB'];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      throw new PaymentError(
        'UNSUPPORTED_CURRENCY',
        `Currency ${currency} is not supported`,
        this.name
      );
    }
  }
  
  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new PaymentError(
        'INVALID_EMAIL',
        'Invalid email format',
        this.name
      );
    }
  }
  
  protected validateOrderId(orderId: string): void {
    if (!orderId || orderId.length > 64) {
      throw new PaymentError(
        'INVALID_ORDER_ID',
        'Order ID must be provided and less than 64 characters',
        this.name
      );
    }
  }
  
  abstract createPayment(request: import('./types').PaymentRequest): Promise<import('./types').PaymentResponse>;
  abstract handleWebhook(data: any): Promise<import('./types').WebhookResult>;
  abstract queryPayment(transactionId: string): Promise<import('./types').PaymentStatus>;
  abstract validateConfig(): boolean;
}

/**
 * 获取支付方式的显示名称（只支持3种俄罗斯支付方式）
 */
export function getPaymentMethodDisplayName(paymentMethod: string): string {
  const displayNames: Record<string, string> = {
    'stripe': 'Credit Card',
    'mir': 'Mir Card',
    'yoomoney': 'YooMoney',
    'sberpa': 'SberPay'
  };
  
  return displayNames[paymentMethod] || paymentMethod;
}

/**
 * 获取支付方式的logo路径（只支持3种俄罗斯支付方式）
 */
export function getPaymentMethodLogo(paymentMethod: string): string {
  const logoMap: Record<string, string> = {
    'stripe': '/payment-logos/stripe.png',
    'mir': '/payment-logos/mir.png',
    'yoomoney': '/payment-logos/yoomoney.png',
    'sberpa': '/payment-logos/sberpa.png'
  };
  
  return logoMap[paymentMethod] || '/payment-logos/default.png';
}

/**
 * 根据国家代码判断是否支持Payssion
 * TODO: 临时注释掉俄罗斯支付，等开通后取消注释
 */
export function shouldUsePayssion(countryCode: string): boolean {
  // 临时注释掉俄罗斯支付逻辑，改用 Stripe
  // const payssionCountries = ['RU', 'BY', 'KZ', 'UA', 'AM', 'AZ', 'GE', 'KG', 'MD', 'TJ', 'TM', 'UZ'];
  // return payssionCountries.includes(countryCode.toUpperCase());
  return false; // 临时返回 false，强制使用 Stripe
}

/**
 * 生成唯一的事务ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`.toUpperCase();
}