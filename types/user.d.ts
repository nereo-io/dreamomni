import type { AttributionSnapshot } from './attribution';

export interface User {
  id?: number;
  uuid?: string;
  email: string;
  created_at?: string;
  nickname: string;
  avatar_url: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  signup_country?: string; // ISO 3166-1 alpha-2 (e.g., US, RU, CN)
  credits?: UserCredits;
  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  is_banned?: boolean; // 用户是否被禁用
  first_touch?: AttributionSnapshot | null;
  last_touch?: AttributionSnapshot | null;
}

export interface UserCredits {
  one_time_credits?: number;
  monthly_credits?: number;
  total_credits?: number;
  used_credits?: number;
  left_credits: number;
  free_credits?: number;
  is_recharged?: boolean;
  is_pro?: boolean;
}
