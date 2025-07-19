"use client";

import { CreemSubscription } from "@/models/creem-subscription";
import { CancelCreemSubscriptionButton } from "./cancel-creem-subscription-button";
import moment from "moment";
import { Badge } from "@/components/ui/badge";

interface CreemSubscriptionCardProps {
  subscription: CreemSubscription;
}

export function CreemSubscriptionCard({
  subscription,
}: CreemSubscriptionCardProps) {
  // 确定显示的下次收费时间
  const getNextBillingDate = () => {
    if (subscription.current_period_end) {
      return moment(subscription.current_period_end).format("MMM DD, YYYY");
    }

    // 如果没有周期结束时间，基于创建时间计算
    if (subscription.created_at) {
      const createdDate = moment(subscription.created_at);
      const nextBilling =
        subscription.plan_type === "yearly"
          ? createdDate.add(1, "year")
          : createdDate.add(1, "month");
      return nextBilling.format("MMM DD, YYYY");
    }

    return null;
  };

  const nextBillingDate = getNextBillingDate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "canceled":
        return "destructive";
      case "past_due":
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

        {subscription.canceled_at && (
          <div className="text-sm text-red-400">
            Canceled on{" "}
            {moment(subscription.canceled_at).format("MMM DD, YYYY")}
          </div>
        )}

        {subscription.current_period_start &&
          subscription.current_period_end && (
            <div className="text-xs text-slate-500">
              Current period:{" "}
              {moment(subscription.current_period_start).format("MMM DD")} -{" "}
              {moment(subscription.current_period_end).format("MMM DD, YYYY")}
            </div>
          )}
      </div>

      <div className="flex items-center gap-2">
        {(subscription.status === "active" ||
          subscription.status === "trialing") &&
          subscription.creem_subscription_id &&
          !subscription.canceled_at && (
            <CancelCreemSubscriptionButton
              subscriptionId={subscription.creem_subscription_id}
            />
          )}
      </div>
    </div>
  );
}
