// 支付服务统一导出

export * from './types';
export * from './PaymentProvider';
export * from './PayssionProvider';
export * from './StripeProvider';
export * from './PaymentRouter';

// 创建全局支付路由器实例
import { PaymentRouter } from './PaymentRouter';

let paymentRouter: PaymentRouter | null = null;

export function getPaymentRouter(): PaymentRouter {
  if (!paymentRouter) {
    paymentRouter = new PaymentRouter();
  }
  return paymentRouter;
}