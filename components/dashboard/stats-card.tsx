import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  total: number;
  today: number;
  yesterday: number;
  icon?: React.ReactNode;
  active?: number;
}

export function StatsCard({
  title,
  total,
  today,
  yesterday,
  icon,
  active,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {/* 昨日数据（放大展示） */}
        <div className="mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            昨日新增
          </div>
          <div className="text-3xl font-bold text-blue-600">{yesterday}</div>
        </div>

        {/* 累计和今日数据 */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              累计
            </div>
            <div className="text-lg font-semibold">{total}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              今日新增
            </div>
            <div className="text-lg font-semibold text-green-500">+{today}</div>
          </div>
          {active !== undefined && (
            <div className="col-span-2">
              <div className="text-xs font-medium text-muted-foreground">
                活跃会员
              </div>
              <div className="text-lg font-semibold text-purple-500">
                {active}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
