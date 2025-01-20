"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function ErrorPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const callbackUrl = searchParams.get("callbackUrl");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border text-primary-foreground">
            <img src="/logo.png" alt="logo" className="size-4" />
          </div>
          {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </a>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">认证错误</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>登录过程中发生错误：</p>
              <div className="space-y-2">
                <p className="font-semibold">错误类型：</p>
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {error}
                </pre>
                
                {message && (
                  <>
                    <p className="font-semibold">错误信息：</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {message}
                    </pre>
                  </>
                )}
                
                {callbackUrl && (
                  <>
                    <p className="font-semibold">回调 URL：</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {callbackUrl}
                    </pre>
                  </>
                )}

                <p className="font-semibold">所有参数：</p>
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(Object.fromEntries([...searchParams.entries()]), null, 2)}
                </pre>
              </div>
              <p>
                请尝试{" "}
                <a href="/auth/signin" className="text-primary hover:underline">
                  重新登录
                </a>{" "}
                或联系支持团队。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 