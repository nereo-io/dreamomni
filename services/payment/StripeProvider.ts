// Stripe 支付提供商包装类 - 保持与现有系统兼容

import { BasePaymentProvider } from './PaymentProvider';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  WebhookResult,
  PaymentError
} from './types';

export class StripeProvider extends BasePaymentProvider {
  name = 'stripe';
  
  validateConfig(): boolean {
    return !!(process.env.STRIPE_PRIVATE_KEY && process.env.STRIPE_PUBLIC_KEY);
  }
  
  /**
   * 创建支付订单 - 委托给现有的 Stripe 实现
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 验证输入参数
      this.validateAmount(request.amount);
      this.validateCurrency(request.currency);
      this.validateEmail(request.userEmail);
      this.validateOrderId(request.orderId);
      
      // 这里我们返回一个标识，让调用方知道需要使用现有的Stripe流程
      return {
        success: true,
        paymentProvider: this.name,
        requiresAction: true, // 标识需要特殊处理
        redirectUrl: '/api/checkout', // 现有的Stripe checkout端点
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message,
        paymentProvider: this.name,
      };
    }
  }
  
  /**
   * 查询支付状态 - 可以通过现有的订单系统实现
   */
  async queryPayment(transactionId: string): Promise<PaymentStatus> {
    // 这里可以查询现有的订单系统
    // 暂时抛出未实现错误，因为现有系统通过webhook处理
    throw new PaymentError(
      'NOT_IMPLEMENTED',
      'Stripe payment query not implemented - use existing webhook system',
      this.name
    );
  }
  
  /**
   * 处理Webhook - 委托给现有的Stripe webhook处理
   */
  async handleWebhook(data: any): Promise<WebhookResult> {
    // Stripe webhook由现有系统处理
    // 这里只是接口兼容性实现
    return {
      success: true,
    };
  }
}