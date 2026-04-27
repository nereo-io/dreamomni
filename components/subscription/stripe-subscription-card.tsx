"use client";

import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { StripeSubscription } from "@/models/stripe-subscription";
import { ManageSubscriptionButton } from "./manage-subscription-button";

interface StripeSubscriptionCardProps {
  subscription: StripeSubscription;
}

export function StripeSubscriptionCard({
  subscription,
}: StripeSubscriptionCardProps) {
  const nextBillingDate = subscription.current_period_end
    ? moment(subscription.current_period_end).format("MMM DD, YYYY")
    : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "canceled":
      case "past_due":
      case "unpaid":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "trialing":
        return "Trial";
      case "canceled":
        return "Canceled";
      case "past_due":
        return "Past Due";
      case "unpaid":
        return "Unpaid";
      case "incomplete":
        return "Incomplete";
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center justify-between p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            {subscription.product_name ||
              `${
                subscription.plan_type === "monthly" ? "Monthly" : "Yearly"
              } Plan`}
          </h3>
          <Badge variant={getStatusColor(subscription.status)}>
            {getStatusText(subscription.status)}
          </Badge>
        </div>

        <div className="text-sm text-slate-400">
          <div>
            Current cycle:{" "}
            {subscription.plan_type === "monthly" ? "Monthly" : "Yearly"}
          </div>
          {nextBillingDate && subscription.status === "active" && (
            <div>Next billing: {nextBillingDate}</div>
          )}
        </div>

        {subscription.current_period_start &&
          subscription.current_period_end && (
            <div className="text-xs text-slate-500">
              Current period:{" "}
              {moment(subscription.current_period_start).format("MMM DD")} -{" "}
              {moment(subscription.current_period_end).format("MMM DD, YYYY")}
            </div>
          )}
      </div>

      {subscription.stripe_customer_id && (
        <ManageSubscriptionButton
          customerId={subscription.stripe_customer_id}
          className="text-white"
        />
      )}
    </div>
  );
}
