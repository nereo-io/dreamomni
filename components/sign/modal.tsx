"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SiGithub, SiGmail, SiGoogle, SiApple } from "react-icons/si";
import { VKLoginButton } from "./vk-login";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import { useEmailAuth } from "@/hooks/useEmailAuth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function SignModal() {
  const t = useTranslations();
  const { showSignModal, setShowSignModal } = useAppContext();
  
  // 提升模式状态到外层组件
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // 动态标题和描述
  const getTitle = () => {
    if (!showEmailAuth) return t("sign_modal.sign_in_title");
    
    switch (mode) {
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      default: return t("sign_modal.sign_in_title");
    }
  };

  const getDescription = () => {
    if (!showEmailAuth) return t("sign_modal.sign_in_description");
    
    switch (mode) {
      case "signup": return "Create a new account to get started";
      case "forgot": return "Enter your email to receive a password reset link";
      default: return t("sign_modal.sign_in_description");
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>
              {getDescription()}
            </DialogDescription>
          </DialogHeader>
          <ProfileForm 
            mode={mode} 
            setMode={setMode}
            showEmailAuth={showEmailAuth}
            setShowEmailAuth={setShowEmailAuth}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showSignModal} onOpenChange={setShowSignModal}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{getTitle()}</DrawerTitle>
          <DrawerDescription>
            {getDescription()}
          </DrawerDescription>
        </DrawerHeader>
        <ProfileForm 
          className="px-4"
          mode={mode} 
          setMode={setMode}
          showEmailAuth={showEmailAuth}
          setShowEmailAuth={setShowEmailAuth}
        />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t("sign_modal.cancel_title")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface EmailFormData {
  email: string;
  password: string;
  name?: string;
}

interface ProfileFormProps extends React.ComponentProps<"form"> {
  mode: "signin" | "signup" | "forgot";
  setMode: (mode: "signin" | "signup" | "forgot") => void;
  showEmailAuth: boolean;
  setShowEmailAuth: (show: boolean) => void;
}

function ProfileForm({ className, mode, setMode, showEmailAuth, setShowEmailAuth }: ProfileFormProps) {
  const t = useTranslations();
  const { setShowSignModal } = useAppContext();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const { login, signup, forgotPassword, resendVerification, isLoading, error, clearError } = useEmailAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EmailFormData>();

  const onSubmit = async (data: EmailFormData) => {
    clearError();
    setMessage(null);

    if (mode === "signin") {
      setPendingVerificationEmail(null);

      const result = await login(data);
      
      if (result && typeof result === "object" && result.error === "EMAIL_NOT_CONFIRMED") {
        setPendingVerificationEmail(result.email || data.email);
      } else if (result === true) {
        // 登录成功，关闭modal
        setShowSignModal(false);
      }
    } else if (mode === "signup") {
      // 注册时检查CAPTCHA
      if (!captchaToken) {
        setMessage("Please complete the CAPTCHA verification");
        return;
      }
      
      const result = await signup({ ...data, captchaToken });
      if (result) {
        if (result.requiresVerification) {
          setPendingVerificationEmail(data.email);
          setMode("signin");
          reset();
          setCaptchaToken(null); // 清空CAPTCHA token
        } else {
          const loginResult = await login({ email: data.email, password: data.password });
          if (loginResult === true) {
            setShowSignModal(false);
          }
        }
      }
    } else if (mode === "forgot") {
      const success = await forgotPassword(data.email);
      if (success) {
        setMessage("Password reset email sent. Please check your inbox.");
        setMode("signin");
      }
    }
  };

  const clearAllStates = () => {
    clearError();
    setMessage(null);
    setPendingVerificationEmail(null);
    setCaptchaToken(null);
    reset();
  };

  const switchMode = (newMode: "signin" | "signup" | "forgot") => {
    setMode(newMode);
    clearAllStates();
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    
    const success = await resendVerification(pendingVerificationEmail);
    if (success) {
      setMessage("Verification email sent. Please check your inbox.");
    }
  };

  const handleBackToSocialLogin = () => {
    setShowEmailAuth(false);
    clearAllStates();
  };

  const handleShowEmailAuth = () => {
    setShowEmailAuth(true);
    clearAllStates();
  };

  return (
    <div className={cn("grid items-start gap-4", className)}>
      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              {error.includes("already registered") && mode === "signup" && (
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-sm text-primary underline underline-offset-4 hover:no-underline"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* 邮箱验证提示 */}
      {pendingVerificationEmail && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p>Account created successfully! We&apos;ve sent a verification email to your inbox. Please check your email and click the verification link to activate your account before signing in.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isLoading}
                className="text-sm text-primary underline underline-offset-4 hover:no-underline"
              >
                Resend verification email
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!showEmailAuth ? (
        <>
          {/* OAuth Providers */}
          <div className="flex flex-col gap-3">
            {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => signIn("google")}
              >
                <SiGoogle className="w-4 h-4" />
                {t("sign_modal.google_sign_in")}
              </Button>
            )}

            {process.env.NEXT_PUBLIC_AUTH_VK_ENABLED === "true" && (
              <VKLoginButton />
            )}

            {process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => signIn("github")}
              >
                <SiGithub className="w-4 h-4" />
                {t("sign_modal.github_sign_in")}
              </Button>
            )}

            {process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === "true" && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => signIn("apple")}
              >
                <SiApple className="w-4 h-4" />
                {t("sign_modal.apple_sign_in")}
              </Button>
            )}
          </div>

          {/* Email Login Toggle */}
          {process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "true" && (
            <>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={handleShowEmailAuth}
              >
                <SiGmail className="w-4 h-4" />
                Continue with Email
              </Button>
            </>
          )}
        </>
      ) : (
        <>
          {/* Email Auth Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...register("name")}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Invalid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {mode !== "forgot" && (
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Turnstile CAPTCHA - Only for signup */}
            {mode === "signup" && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                    setMessage(null); // Clear CAPTCHA error message
                  }}
                  onExpire={() => {
                    setCaptchaToken(null);
                  }}
                  onError={() => {
                    setCaptchaToken(null);
                    setMessage("CAPTCHA verification failed. Please try again.");
                  }}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (mode === "signup" && !captchaToken)}>
              {isLoading ? "Loading..." : (
                mode === "signin" ? "Sign In" :
                mode === "signup" ? "Create Account" : "Send Reset Email"
              )}
            </Button>
          </form>

          {/* Mode Switch Links */}
          <div className="text-center text-xs space-y-2">
            {mode === "signin" && (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <p>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </p>
            )}
            <p>
              <button
                type="button"
                onClick={handleBackToSocialLogin}
                className="underline underline-offset-4 hover:text-primary"
              >
                ← Back to social login
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
