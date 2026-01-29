export interface Credit {
  trans_no: string;
  created_at: string;
  user_uuid: string;
  trans_type: string;
  credits: number;
  order_no: string;
  expired_at?: string;
  payment_id?: string;
}

export interface CreditPool {
  order_no: string;
  expired_at: string;
  balance: number;
  earned: number;
  used: number;
  status: string;
  created_at: string;
}
