import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Membership } from "@/types/membership";
import moment from "moment";
import { Badge } from "@/components/ui/badge";

interface Props {
  title: string;
  description: string;
  membership?: Membership;
}

export default function MembershipStatus({ title, description, membership }: Props) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {membership ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">会员状态</span>
              <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                {membership.status === 'active' ? '有效' : '已过期'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">会员类型</span>
              <span className="text-sm font-medium">
                {membership.plan_type === 'monthly' ? '月度会员' : '年度会员'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">开始时间</span>
              <span className="text-sm font-medium">
                {moment(membership.start_date).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">到期时间</span>
              <span className="text-sm font-medium">
                {moment(membership.end_date).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">暂无会员信息</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 