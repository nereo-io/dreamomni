import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 错误码到用户友好消息的映射
const errorMessages: Record<string, string> = {
  Signin: "Sign in failed. Please check your credentials and try again.",
  OAuthSignin: "Error occurred during OAuth sign in. Please try again.",
  OAuthCallback: "Error occurred during OAuth callback. Please try again.",
  OAuthCreateAccount: "Could not create OAuth account. Please try again.",
  EmailCreateAccount: "Could not create email account. Please try again.",
  Callback: "Error occurred during callback. Please try again.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email address.",
  CredentialsSignin:
    "Sign in failed. Please check your credentials and try again.",
  default: "An error occurred during authentication. Please try again.",
};

interface ErrorPageProps {
  searchParams: {
    error?: string;
    message?: string;
  };
}

function ErrorContent({ searchParams }: ErrorPageProps) {
  const { error, message } = searchParams;

  // 如果没有错误参数，重定向到登录页面
  if (!error) {
    redirect("/auth/signin");
  }

  // 获取用户友好的错误消息
  const errorMessage = message || errorMessages[error] || errorMessages.default;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md border text-primary-foreground">
            <img src="/logo.png" alt="logo" className="size-4" />
          </div>
          {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Authentication Error</CardTitle>
            <CardDescription>
              There was a problem signing you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/signin">Try Again</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ErrorPage(props: ErrorPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent {...props} />
    </Suspense>
  );
}
