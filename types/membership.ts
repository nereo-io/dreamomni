export interface Membership {
  id: string;
  user_uuid: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
  plan_type: 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
}

// export interface MembershipPlan {
//   id: string;
//   name: string;
//   type: 'monthly' | 'yearly';
//   price: number;
//   description: string;
//   features: string[];
// } 