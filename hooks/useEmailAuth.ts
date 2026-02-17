"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useYandexTracking } from "@/hooks/useYandexTracking";

interface SignupData {
  email: string;
  password: string;
  name?: string;
  captchaToken?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export function useEmailAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { trackSignup } = useYandexTracking();

  const login = async (data: LoginData, callbackUrl?: string): Promise<boolean | { error: string; email?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // 首先使用我们的自定义API验证凭据
      const response = await fetch("/api/auth/email-signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "email_not_confirmed") {
          // 邮箱未验证的错误需要特殊处理
          setError(result.message);
          return { error: "EMAIL_NOT_CONFIRMED", email: result.email };
        }
        
        setError(result.message || "Login failed. Please try again.");
        return false;
      }

      // 如果凭据验证成功，使用NextAuth进行会话管理
      const authResult = await signIn("email", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (authResult?.ok) {
        router.push(callbackUrl || "/image-to-video");
        return true;
      }

      setError("Login failed. Please try again.");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Registration failed");
        return false;
      }

      if (result?.data?.user?.id) {
        trackSignup("email", result.data.user.id);
      }

      // 返回完整结果对象，包括消息
      return {
        ...result.data,
        message: result.message,
      };
    } catch (error) {
      console.error("Signup error:", error);
      setError("Registration failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to send reset email");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Failed to send reset email. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to send verification email");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Failed to send verification email. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    forgotPassword,
    resendVerification,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
