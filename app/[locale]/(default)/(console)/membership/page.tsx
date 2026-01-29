import { getUserUuid } from "@/services/user";
import { findActiveMembershipByUserUuid } from "@/models/membership";
import { getStripeCustomerId } from "@/models/user";
import { findSubscriptionsByUserUuid } from "@/models/subscription";
import { findCreemSubscriptionsByUserUuid } from "@/models/creem-subscription";
import { getUserCreditPools } from "@/models/credit";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManageSubscriptionButton } from "@/components/subscription/manage-subscription-button";
import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { CreemSubscriptionCard } from "@/components/subscription/creem-subscription-card";
import { LocalTime } from "@/components/ui/local-time";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/membership`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // 获取会员信息
  const membership = await findActiveMembershipByUserUuid(user_uuid);
  // 获取 Stripe Customer ID
  const stripeCustomerId = await getStripeCustomerId(user_uuid);
  // 获取 Payssion 订阅信息
  const payssionSubscriptions = await findSubscriptionsByUserUuid(user_uuid);
  // 获取 Creem 订阅信息
  const creemSubscriptions = await findCreemSubscriptionsByUserUuid(user_uuid);
  // 获取积分池信息
  const creditPools = await getUserCreditPools(user_uuid);

  return (
    <div className="container px-4 md:px-6 max-w-5xl py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("membership.title")}</CardTitle>
            {stripeCustomerId && (
              <ManageSubscriptionButton customerId={stripeCustomerId} />
            )}
          </div>
          <CardDescription>{t("membership.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {membership ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("membership.status")}
                </span>
                <Badge
                  variant={
                    membership.status === "active" ? "default" : "secondary"
                  }
                >
                  {membership.status === "active"
                    ? t("membership.status_active")
                    : t("membership.status_expired")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("membership.type")}
                </span>
                <span className="text-sm font-medium">
                  {membership.plan_type === "monthly"
                    ? t("membership.type_monthly")
                    : t("membership.type_yearly")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("membership.start_date")}
                </span>
                <span className="text-sm font-medium">
                  <LocalTime date={membership.start_date} format="date" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("membership.end_date")}
                </span>
                <span className="text-sm font-medium">
                  <LocalTime date={membership.end_date} format="date" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("membership.remaining_days")}
                </span>
                <span className="text-sm font-medium">
                  {Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}{" "}
                  {t("membership.days")}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                {t("membership.no_membership")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Pools */}
      {creditPools.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("creditPools.title")}</CardTitle>
            <CardDescription>{t("creditPools.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("creditPools.table.order_no")}</TableHead>
                  <TableHead>{t("creditPools.table.expired_at")}</TableHead>
                  <TableHead>{t("creditPools.table.balance")}</TableHead>
                  <TableHead>{t("creditPools.table.earned")}</TableHead>
                  <TableHead>{t("creditPools.table.used")}</TableHead>
                  <TableHead>{t("creditPools.table.created_at")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditPools.map((pool, index) => (
                  <TableRow key={pool.order_no || `bonus-${index}`}>
                    <TableCell>
                      {pool.order_no || t("creditPools.bonus")}
                    </TableCell>
                    <TableCell>
                      <LocalTime date={pool.expired_at} format="date" />
                    </TableCell>
                    <TableCell className="font-medium">{pool.balance}</TableCell>
                    <TableCell className="text-green-600">+{pool.earned}</TableCell>
                    <TableCell className="text-red-600">-{pool.used}</TableCell>
                    <TableCell>
                      <LocalTime date={pool.created_at} format="date" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payssion 订阅信息 */}
      {payssionSubscriptions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("subscription.allSubscriptions")}</CardTitle>
            <CardDescription>
              {t("subscription.subscriptionHistory")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payssionSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creem 订阅信息 */}
      {creemSubscriptions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("subscription.allSubscriptions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creemSubscriptions.map((subscription) => (
                <CreemSubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
