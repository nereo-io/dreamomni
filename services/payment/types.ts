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

// 订阅相关接口定义
export interface SubscriptionRequest {
  userUuid: string;
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  interval: string;
  paymentMethod: string; // mir, yoomoney, sberpay (前端格式)
  planType: "monthly" | "yearly" | "quarterly";
  description?: string;
  returnUrl: string;
  notifyUrl: string;
  reference?: string;
  mandateId?: string; // V2 API 需要的 mandate ID
  metadata?: Record<string, any>; // 添加metadata支持
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  mandateId?: string;
  redirectUrl?: string; // 用户需要访问的授权 URL
  errorMessage?: string;
  errorCode?: string;
  requiresAction?: boolean;
  paymentProvider: string;
}

export interface SubscriptionStatus {
  subscriptionId: string;
  mandateId?: string;
  status: string; // created, active, canceled, completed
  amount: number;
  currency: string;
  planType: string;
  timesCompleted: number;
  totalTimes: number;
  nextBillingDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  paymentProvider: string;
}

export interface MandateRequest {
  userUuid: string;
  userEmail: string;
  paymentMethod: string;
  returnUrl: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface MandateResponse {
  success: boolean;
  mandateId?: string;
  redirectUrl?: string; // 用户授权 URL
  status?: string;
  subscriptionId?: string; // 如果直接创建了订阅
  errorMessage?: string;
  errorCode?: string;
}

export interface SubscriptionWebhookResult {
  success: boolean;
  error?: string;
  subscriptionId?: string;
  mandateId?: string;
  eventType?: string;
  status?: string;
}

// 支付提供商抽象接口
export interface PaymentProvider {
  name: string;

  /**
   * 创建授权 (订阅功能)
   */
  createMandate(request: MandateRequest): Promise<MandateResponse>;

  /**
   * 创建订阅 (订阅功能)
   */
  createSubscription(
    request: SubscriptionRequest
  ): Promise<SubscriptionResponse>;

  /**
   * 查询订阅状态 (订阅功能)
   */
  querySubscription?(subscriptionId: string): Promise<SubscriptionStatus>;

  /**
   * 取消订阅 (订阅功能)
   */
  cancelSubscription?(subscriptionId: string): Promise<boolean>;

  /**
   * 处理订阅 Webhook (订阅功能)
   */
  handleSubscriptionWebhook(data: any): Promise<SubscriptionWebhookResult>;

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
    this.name = "PaymentError";
  }
}

// 支付提供商枚举
export enum PaymentProviderType {
  STRIPE = "stripe",
  PAYSSION = "payssion",
}

// 支付状态枚举
export enum PaymentStatusType {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  REFUNDED = "refunded",
  PARTIAL_PAID = "paid_partial",
  OVERPAID = "paid_more",
}
