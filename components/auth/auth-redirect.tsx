"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthRedirectProps {
  redirectTo?: string;
  preserveSearchParams?: boolean;
}

export default function AuthRedirect({
  redirectTo = "/image-to-video",
  preserveSearchParams = false,
}: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "loading") return; // 等待认证状态加载

    if (session) {
      const query = preserveSearchParams ? searchParams?.toString() : "";
      const destination = query ? `${redirectTo}?${query}` : redirectTo;
      router.replace(destination);
    }
  }, [preserveSearchParams, redirectTo, router, searchParams, session, status]);

  return null; // 不渲染任何内容
}
