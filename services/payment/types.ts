// 支付提供商接口和类型定义

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  userEmail: string;
  userName?: string;
  returnUrl: string;
  notifyUrl: string;
  description: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  errorMessage?: string;
  errorCode?: string;
  requiresAction?: boolean;
  paymentProvider: string;
}

export interface PaymentStatus {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  paidAmount?: number;
  fee?: number;
  errorMessage?: string;
  paymentProvider: string;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
  orderId?: string;
  status?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  currency: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  errorMessage?: string;
}

// 支付提供商抽象接口
export interface PaymentProvider {
  name: string;
  
  /**
   * 创建支付订单
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  /**
   * 处理支付回调通知
   */
  handleWebhook(data: any): Promise<WebhookResult>;
  
  /**
   * 查询支付状态
   */
  queryPayment(transactionId: string): Promise<PaymentStatus>;
  
  /**
   * 取消支付 (可选)
   */
  cancelPayment?(transactionId: string): Promise<boolean>;
  
  /**
   * 退款 (可选)
   */
  refundPayment?(request: RefundRequest): Promise<RefundResult>;
  
  /**
   * 验证配置
   */
  validateConfig(): boolean;
}

// 支付方式配置
export interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  provider: string;
  supportedCountries: string[];
  feeInfo?: string;
  processingTime?: string;
}

// 地理位置信息
export interface LocationInfo {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  ip?: string;
}

// 错误类型
export class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public provider: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// 支付提供商枚举
export enum PaymentProviderType {
  STRIPE = 'stripe',
  PAYSSION = 'payssion'
}

// 支付状态枚举
export enum PaymentStatusType {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
  PARTIAL_PAID = 'paid_partial',
  OVERPAID = 'paid_more'
}