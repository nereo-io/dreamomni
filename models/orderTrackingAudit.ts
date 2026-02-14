import { getSupabaseClient } from "@/models/db";

export interface OrderTrackingAudit {
  order_no: string;
  user_uuid?: string;
  payment_provider?: string;
  payment_method?: string;
  has_client_id: boolean;
  request_host?: string;
  request_referer?: string;
  request_user_agent?: string;
}

export async function insertOrderTrackingAudit(audit: OrderTrackingAudit) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("order_tracking_audits")
    .insert(audit);

  if (error) {
    throw error;
  }

  return data;
}
