import {
  getUserStatistics,
  getCustomerInfoStatistics,
  getChatSessionStatistics,
  getChatMessageStatistics,
  getMembershipStatistics,
} from "@/models/statistics";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  MessageSquare,
  User,
  MessageCircle,
  Crown,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function DataPage() {
  // 获取各类统计数据
  const userStats = await getUserStatistics();
  const customerStats = await getCustomerInfoStatistics();
  const sessionStats = await getChatSessionStatistics();
  const messageStats = await getChatMessageStatistics();
  const membershipStats = await getMembershipStatistics();

  // 获取当前UTC时间
  const now = new Date();
  const utcDateString = now.toISOString().split("T")[0];
  const utcTimeString = now.toISOString().split("T")[1].substring(0, 8);

  // 计算昨天的UTC日期
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayUtcString = yesterday.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">数据统计</h2>
        <p className="text-muted-foreground">
          平台数据概览，包括用户、客户信息、聊天会话、聊天消息和会员等数据。
        </p>
      </div>

      {/* UTC时间展示 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">
                当前UTC时间：{utcDateString} {utcTimeString}
              </div>
              <div className="text-xs text-muted-foreground">
                昨日UTC日期：{yesterdayUtcString}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">说明：</span>
                所有统计数据基于UTC时间，"昨日"指{yesterdayUtcString}，"今日"指
                {utcDateString}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="用户总数"
          total={userStats.total}
          today={userStats.today}
          yesterday={userStats.yesterday}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="客户信息"
          total={customerStats.total}
          today={customerStats.today}
          yesterday={customerStats.yesterday}
          icon={<User className="h-4 w-4" />}
        />
        <StatsCard
          title="聊天会话"
          total={sessionStats.total}
          today={sessionStats.today}
          yesterday={sessionStats.yesterday}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatsCard
          title="聊天消息"
          total={messageStats.total}
          today={messageStats.today}
          yesterday={messageStats.yesterday}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="会员"
          total={membershipStats.total}
          today={membershipStats.today}
          yesterday={membershipStats.yesterday}
          active={membershipStats.active}
          icon={<Crown className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
