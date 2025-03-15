import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TargetBoardProps {
  thisMonthUsers: number;
  thisMonthPaidUsers: number;
  userTarget: number;
  paidUserTarget: number;
}

export function TargetBoard({
  thisMonthUsers,
  thisMonthPaidUsers,
  userTarget,
  paidUserTarget,
}: TargetBoardProps) {
  // 计算进度百分比
  const userProgress = Math.min((thisMonthUsers / userTarget) * 100, 100);
  const paidProgress = Math.min(
    (thisMonthPaidUsers / paidUserTarget) * 100,
    100
  );

  // 计算当月时间进度
  const calculateMonthProgress = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const totalDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    return Math.min((currentDay / totalDays) * 100, 100);
  };

  const timeProgress = calculateMonthProgress();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">3月目标追踪</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 月份时间进度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">月份时间进度</p>
              <p className="text-2xl font-bold">{timeProgress.toFixed(1)}%</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {timeProgress.toFixed(1)}%
            </p>
          </div>
          <Progress value={timeProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">新增用户目标</p>
              <p className="text-2xl font-bold">
                {thisMonthUsers} / {userTarget}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {userProgress.toFixed(1)}%
            </p>
          </div>
          <Progress value={userProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">付费用户目标</p>
              <p className="text-2xl font-bold">
                {thisMonthPaidUsers} / {paidUserTarget}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {paidProgress.toFixed(1)}%
            </p>
          </div>
          <Progress value={paidProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
