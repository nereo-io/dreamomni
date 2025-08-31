import { NextRequest } from "next/server";
import { respJson, respErr } from "@/lib/resp";
import { signUpWithEmail } from "@/services/supabase-auth";
import { yandexTracking } from "@/services/analytics/yandex-tracking";
import { z } from "zod";

// 简单的攻击邮箱域名黑名单（只屏蔽已知攻击域名）
const BLOCKED_EMAIL_DOMAINS = [
  'drmail.in',      // 主要攻击域名 (10,761个账号)
  'mriscan.live',   // 攻击域名 (60个账号)
  'powerscrews.com' // 攻击域名 (2个账号)
];

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求数据
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return respErr(validation.error.errors[0].message);
    }

    const { email, password, name } = validation.data;

    // 简单检查：只屏蔽已知攻击邮箱域名
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (BLOCKED_EMAIL_DOMAINS.includes(emailDomain)) {
      console.warn(`Registration blocked for attack domain: ${emailDomain}`);
      return respErr("This email provider is not supported");
    }

    // 调用Supabase注册
    const result = await signUpWithEmail(email, password, name);

    if (!result.user) {
      return respErr("Registration failed");
    }

    // 检查是否需要邮箱验证
    if (!result.user.email_confirmed_at) {
      return respJson(
        0,
        "Account created successfully! We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.",
        {
          requiresVerification: true,
          user: {
            id: result.user.id,
            email: result.user.email,
          },
        }
      );
    }

    return respJson(0, "Registration successful", {
      requiresVerification: false,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name,
      },
    });
  } catch (error: any) {
    // 错误已在Service层记录，API层只处理响应
    // 仅对未预期的错误记录日志
    
    // 根据官方错误代码进行处理
    if (error.code) {
      switch (error.code) {
        case "email_exists":
        case "user_already_exists":
          return respErr(
            "This email address is already registered. Please try signing in instead."
          );
        case "phone_exists":
          return respErr(
            "This phone number is already registered. Please try signing in instead."
          );
        case "email_address_invalid":
        case "validation_failed":
          return respErr("Please enter a valid email address.");
        case "weak_password":
          return respErr(
            "Password is too weak. Please choose a stronger password."
          );
        case "signup_disabled":
          return respErr("New account creation is currently disabled.");
        case "email_provider_disabled":
          return respErr("Email registration is currently disabled.");
        case "phone_provider_disabled":
          return respErr("Phone registration is currently disabled.");
        case "over_request_rate_limit":
        case "too_many_requests":
        case "over_email_send_rate_limit":
          return respErr(
            "Too many attempts. Please wait a moment and try again."
          );
        case "email_address_not_authorized":
          return respErr(
            "This email address is not authorized for registration. Please contact support."
          );
        case "captcha_failed":
          return respErr("Captcha verification failed. Please try again.");
        case "unexpected_failure":
        case "internal_error":
          return respErr(
            "An unexpected error occurred. Please try again later."
          );
        default:
          return respErr(
            error.message || "Unable to create account. Please try again."
          );
      }
    }

    // 如果没有error.code，则回退到消息检测（兼容旧版本）
    if (
      error.message?.includes("User already registered") ||
      error.message?.includes("already been registered") ||
      error.message?.includes("email address is already taken") ||
      error.message?.includes(
        "A user with this email address has already been registered"
      ) ||
      error.message?.includes("email address already exists") ||
      error.message?.includes("email_exists") ||
      error.message?.includes("user_already_exists") ||
      error.message?.includes("duplicate") ||
      error.status === 409 ||
      error.code === "23505"
    ) {
      // PostgreSQL unique constraint violation
      return respErr(
        "This email address is already registered. Please try signing in instead."
      );
    }

    if (
      error.message?.includes("invalid email") ||
      error.message?.includes("Invalid email")
    ) {
      return respErr("Please enter a valid email address.");
    }

    if (
      error.message?.includes("weak password") ||
      error.message?.includes("Password should")
    ) {
      return respErr(
        "Password is too weak. Please choose a stronger password."
      );
    }

    if (
      error.message?.includes("rate limit") ||
      error.message?.includes("too many")
    ) {
      return respErr("Too many attempts. Please wait a moment and try again.");
    }

    // 提供通用的友好错误消息
    return respErr(
      error.message || "Unable to create account. Please try again."
    );
  }
}
