// 邀请功能已禁用以防止薅羊毛行为
"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function Invite({ summary }: { summary: any }) {
  const t = useTranslations();

  return (
    <Card className="p-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold mb-2">邀请功能维护中</h2>
        <p className="text-gray-600 mb-4">
          为了提供更好的服务体验，邀请功能暂时停用维护
        </p>
        <p className="text-sm text-gray-500">
          如有疑问请联系客服支持
        </p>
      </div>
    </Card>
  );
}
