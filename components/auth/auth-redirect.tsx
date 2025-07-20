"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // 等待认证状态加载
    
    if (session) {
      router.push("/image-to-video"); // 已登录用户重定向到/image-to-video
    }
  }, [session, status, router]);

  return null; // 不渲染任何内容
}