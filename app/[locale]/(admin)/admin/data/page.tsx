import { auth } from "@/auth";
import {
  getUserStatistics,
  getVideoGenerationStatistics,
  getVideoGenerationByModel,
  getOrderStatistics,
  getMembershipDetailedStatistics,
  getTargetMetrics,
  getTodayVideoStatistics,
  getLatestVideoStatusStatistics,
} from "@/models/statistics";
import {
  UserStatistics,
  VideoGenerationStatistics,
  ModelUsageStatistics,
  OrderStatistics,
  MembershipStatistics,
  TargetMetrics,
} from "@/types/statistics";
import { EnhancedStatsCard } from "@/components/dashboard/enhanced-stats-card";
import { VideoGenerationStatsCard } from "@/components/dashboard/video-generation-stats-card";
import { EnhancedTargetBoard } from "@/components/dashboard/enhanced-target-board";
import ModelUsageChart from "@/components/dashboard/model-usage-chart";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Data Analytics Dashboard - veo3 AI",
    description:
      "Comprehensive analytics and business intelligence dashboard for veo3 AI platform",
  };
}

export default async function DataPage() {
  // 并行获取所有统计数据
  const [
    userStats,
    videoStats,
    modelUsage,
    orderStats,
    membershipStats,
    targetMetrics,
    todayVideoStats,
    latestVideoStatusStats,
  ] = await Promise.all([
    getUserStatistics(),
    getVideoGenerationStatistics(),
    getVideoGenerationByModel(),
    getOrderStatistics(),
    getMembershipDetailedStatistics(),
    getTargetMetrics(),
    getTodayVideoStatistics(),
    getLatestVideoStatusStatistics(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Analytics Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        UTC timezone. Comprehensive business intelligence and performance
        metrics for veo3 AI platform
      </p>

      {/* Key Performance Indicators - 移到 Core Metrics 后面 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Performance Metrics */}
          <div className="bg-card p-6 rounded-lg shadow border">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Success Rates
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Video Generation Success Rate
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {videoStats.overallSuccessRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Order Conversion Rate
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {orderStats.overallConversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Membership Rate
                </span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {membershipStats.totalMemberships > 0
                    ? (
                        (membershipStats.activeMemberships /
                          membershipStats.totalMemberships) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Yesterday's Performance */}
          <div className="bg-card p-6 rounded-lg shadow border">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Yesterday's Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Users</span>
                <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {userStats.yesterdayNewUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Videos Generated
                </span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {videoStats.yesterdayGenerations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  New Orders
                </span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {orderStats.yesterdayOrders.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Indicators */}
          <div className="bg-card p-6 rounded-lg shadow border">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Growth Indicators
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Weekly New Users
                </span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {userStats.thisWeekNewUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Monthly Videos
                </span>
                <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                  {videoStats.thisMonthGenerations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Models
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {modelUsage.length}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Video Performance */}
          <div className="bg-card p-6 rounded-lg shadow border">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Today's Video Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Today Videos Generated
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {todayVideoStats.todayTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Today Success Rate
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {todayVideoStats.todaySuccessRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Latest 10 Videos Status
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">
                    Success:
                  </span>
                  <span className="font-medium">
                    {latestVideoStatusStats.successCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">
                    Failed:
                  </span>
                  <span className="font-medium">
                    {latestVideoStatusStats.failedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">
                    Processing:
                  </span>
                  <span className="font-medium">
                    {latestVideoStatusStats.processingCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Metrics Overview */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Core Metrics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Statistics - 昨日新用户为主 */}
          <EnhancedStatsCard
            title="User Statistics"
            primaryValue={{
              label: "Yesterday New Users",
              value: userStats.yesterdayNewUsers,
            }}
            secondaryValues={[
              {
                label: "Total Users",
                value: userStats.totalUsers,
              },
              {
                label: "Today New Users",
                value: userStats.todayNewUsers,
              },
              {
                label: "This Week New Users",
                value: userStats.thisWeekNewUsers,
              },
              {
                label: "This Month New Users",
                value: userStats.thisMonthNewUsers,
              },
            ]}
          />

          {/* Video Generation Statistics - 昨日生成数为主 */}
          <VideoGenerationStatsCard
            stats={videoStats}
            showYesterdayFirst={true}
          />

          {/* Order Statistics - 昨日订单为主 */}
          <EnhancedStatsCard
            title="Order Statistics"
            primaryValue={{
              label: "Yesterday Orders",
              value: orderStats.yesterdayOrders,
            }}
            secondaryValues={[
              {
                label: "Total Orders",
                value: orderStats.totalOrders,
              },
              {
                label: "Today Orders",
                value: orderStats.todayOrders,
              },
              {
                label: "Total Paid Orders",
                value: orderStats.totalPaidOrders,
              },
              {
                label: "Conversion Rate",
                value: `${orderStats.overallConversionRate}%`,
              },
            ]}
          />

          {/* Membership Statistics - 昨日新会员为主 */}
          <EnhancedStatsCard
            title="Membership Statistics"
            primaryValue={{
              label: "Yesterday New Memberships",
              value: membershipStats.yesterdayNewMemberships,
            }}
            secondaryValues={[
              {
                label: "Total Memberships",
                value: membershipStats.totalMemberships,
              },
              {
                label: "Active Memberships",
                value: membershipStats.activeMemberships,
              },
              {
                label: "Today New Memberships",
                value: membershipStats.todayNewMemberships,
              },
              {
                label: "This Month New Memberships",
                value: membershipStats.thisMonthNewMemberships,
              },
            ]}
          />
        </div>
      </section>

      {/* Target Board */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Monthly Targets</h2>
        <EnhancedTargetBoard targetMetrics={targetMetrics} />
      </section>

      {/* Model Usage Analysis */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">AI Model Usage Analysis</h2>
        <ModelUsageChart
          data={modelUsage.map((stat) => ({
            model_id: stat.modelName,
            count: stat.totalUsage,
            percentage: stat.usagePercentage,
          }))}
        />
      </section>
    </div>
  );
}
