"use client";

import { Subscription } from "@/models/subscription";
import { CancelSubscriptionButton } from "./cancel-subscription-button";
import { useSubscriptionDetails } from "@/hooks/useSubscriptionDetails";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { details, loading } = useSubscriptionDetails(
    subscription.status === "active" ? subscription.payssion_subscription_id : null
  );

  // 获取状态对应的 Badge 样式
  const getStatusVariant = (status: Subscription['status']) => {
    switch (status) {
      case "active":
        return "default";
      case "canceled":
        return "destructive";
      case "expired":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  // 获取状态显示文本
  const getStatusText = (status: Subscription['status']) => {
    switch (status) {
      case "active":
        return "Active";
      case "canceled":
        return "Canceled";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  // 确定显示的下次收费时间
  const getNextBillingDate = () => {
    // 优先使用 API 返回的详情
    if (details?.nextBillingDate) {
      return moment(details.nextBillingDate).format("MMM DD, YYYY");
    }
    
    // 回退到数据库中的数据
    if (subscription.current_period_end) {
      return moment(subscription.current_period_end).format("MMM DD, YYYY");
    }
    
    // 如果都没有，基于创建时间计算
    if (subscription.created_at) {
      const createdDate = moment(subscription.created_at);
      const nextBilling = subscription.plan_type === "yearly" 
        ? createdDate.add(1, 'year')
        : createdDate.add(1, 'month');
      return nextBilling.format("MMM DD, YYYY");
    }
    
    return null;
  };

  const nextBillingDate = getNextBillingDate();

  return (
    <div className="flex items-center justify-between p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            {subscription.product_name || `${subscription.plan_type === "monthly" ? "Monthly" : "Yearly"} Plan`}
          </h3>
          <Badge variant={getStatusVariant(subscription.status)}>
            {getStatusText(subscription.status)}
          </Badge>
        </div>
        <div className="text-sm text-slate-400">
          Current cycle: {subscription.plan_type === "monthly" ? "Monthly" : "Yearly"}
          {nextBillingDate && (
            <span> | Next billing: {nextBillingDate}</span>
          )}
          {loading && !nextBillingDate && (
            <span> | Loading billing info...</span>
          )}
        </div>
        {subscription.canceled_at && (
          <div className="text-sm text-red-400">
            Canceled on {moment(subscription.canceled_at).format("MMM DD, YYYY")}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {subscription.status === "active" && subscription.payssion_subscription_id && !subscription.canceled_at && (
          <CancelSubscriptionButton
            subscriptionId={subscription.payssion_subscription_id}
          />
        )}
      </div>
    </div>
  );
}