import type { AttributionSnapshot } from './attribution';

export interface Order {
  order_no: string;
  created_at: string;
  user_uuid: string;
  user_email: string;
  amount: number;
  interval: string;
  expired_at: string;
  status: string;
  stripe_session_id?: string;
  credits: number;
  currency: string;
  sub_id?: string;
  sub_interval_count?: number;
  sub_cycle_anchor?: number;
  sub_period_end?: number;
  sub_period_start?: number;
  sub_times?: number;
  product_id?: string;
  product_name?: string;
  product_type?: string;
  valid_months?: number;
  order_detail?: string;
  paid_at?: string;
  paid_email?: string;
  paid_detail?: string;
  // 新增支付提供商相关字段
  payment_provider?: string;
  payment_method?: string;
  payssion_transaction_id?: string;
  payment_provider_fee?: number;
  // Yandex Metrica tracking
  client_id?: string | null;
  first_touch?: AttributionSnapshot | null;
  last_touch?: AttributionSnapshot | null;
  subscription_status?: string;
  // 续费订单支持
  is_renewal: boolean;
  payment_id?: string | null;
  // 按月发放积分标记（仅年订阅）
  is_monthly_distribution?: boolean;
}
