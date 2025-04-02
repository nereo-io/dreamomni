export interface Feedback {
  id: string;
  feedback_type: string;
  content: string;
  email?: string;
  user_id?: string;
  status: "new" | "pending" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  resolvedA_at?: string;
  admin_response?: string;
}

export interface CreateFeedbackInput {
  feedback_type: string;
  content: string;
  email?: string;
  user_id?: string;
}

export interface UpdateFeedbackInput {
  status?: "new" | "pending" | "resolved" | "closed";
  resolved_at?: string;
  admin_response?: string;
}
