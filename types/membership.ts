export interface Membership {
  id: string;
  user_uuid: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired";
  plan_type: "monthly" | "yearly" | "quarterly";
  created_at: string;
  updated_at: string;
}
