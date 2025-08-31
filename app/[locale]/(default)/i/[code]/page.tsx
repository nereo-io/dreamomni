// 邀请链接页面已禁用以防止薅羊毛行为
"use client";

import { useEffect } from "react";

export default function ({ params }: { params: { code: string } }) {
  useEffect(() => {
    // 直接重定向到首页，不处理邀请码
    console.log("Invite feature disabled, redirecting to home");
    window.location.href = "/";
  }, [params.code]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      loading...
    </div>
  );
}

/* 
已注释的原始邀请码处理逻辑：

"use client";

import { CacheKey } from "@/services/constant";
import { cacheSet } from "@/lib/cache";
import { getTimestamp } from "@/lib/time";
import { useEffect } from "react";

export default function ({ params }: { params: { code: string } }) {
  useEffect(() => {
    // expires 30 days
    const expires = 2592000;
    const expiresAt = getTimestamp() + expires;

    cacheSet(CacheKey.InviteCode, params.code, expiresAt);
    console.log("cache invite code", params.code, expiresAt);
    window.location.href = "/";
  }, [params.code]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      loading...
    </div>
  );
}
*/
