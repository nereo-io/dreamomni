/**
 * Supabase 官方错误代码映射表
 * 基于官方文档: https://supabase.com/docs/guides/auth/debugging/error-codes
 */

export interface SupabaseErrorCode {
  code: string;
  description: string;
  userMessage: string;
  category: "auth" | "validation" | "rate_limit" | "server" | "config";
  severity: "low" | "medium" | "high";
}

export const SUPABASE_ERROR_CODES: Record<string, SupabaseErrorCode> = {
  // 认证相关错误
  invalid_credentials: {
    code: "invalid_credentials",
    description: "Login credentials or grant type not recognized",
    userMessage:
      "Invalid email or password. Please check your credentials and try again.",
    category: "auth",
    severity: "medium",
  },
  email_not_confirmed: {
    code: "email_not_confirmed",
    description:
      "Signing in is not allowed for this user as the email address is not confirmed",
    userMessage:
      "Please check your email and click the verification link to activate your account before signing in.",
    category: "auth",
    severity: "medium",
  },
  phone_not_confirmed: {
    code: "phone_not_confirmed",
    description:
      "Signing in is not allowed for this user as the phone number is not confirmed",
    userMessage: "Please verify your phone number before signing in.",
    category: "auth",
    severity: "medium",
  },
  user_not_found: {
    code: "user_not_found",
    description: "User to which the API request relates no longer exists",
    userMessage:
      "No account found with this email address. Please check your email or sign up for a new account.",
    category: "auth",
    severity: "medium",
  },
  user_already_exists: {
    code: "user_already_exists",
    description:
      "User with this information (email address, phone number) cannot be created again as it already exists",
    userMessage:
      "This email address is already registered. Please try signing in instead.",
    category: "auth",
    severity: "medium",
  },
  email_exists: {
    code: "email_exists",
    description: "Email address already exists in the system",
    userMessage:
      "This email address is already registered. Please try signing in instead.",
    category: "auth",
    severity: "medium",
  },
  phone_exists: {
    code: "phone_exists",
    description: "Phone number already exists in the system",
    userMessage:
      "This phone number is already registered. Please try signing in instead.",
    category: "auth",
    severity: "medium",
  },
  user_banned: {
    code: "user_banned",
    description: "User has a banned_until property which is still active",
    userMessage:
      "Your account has been temporarily suspended. Please contact support for assistance.",
    category: "auth",
    severity: "high",
  },
  session_expired: {
    code: "session_expired",
    description: "Session has expired",
    userMessage: "Your session has expired. Please sign in again.",
    category: "auth",
    severity: "low",
  },
  session_not_found: {
    code: "session_not_found",
    description: "Session no longer exists",
    userMessage: "Your session is no longer valid. Please sign in again.",
    category: "auth",
    severity: "low",
  },

  // 验证相关错误
  validation_failed: {
    code: "validation_failed",
    description: "Provided parameters are not in the expected format",
    userMessage: "Invalid email or password format. Please check your input.",
    category: "validation",
    severity: "medium",
  },
  email_address_invalid: {
    code: "email_address_invalid",
    description: "Example and test domains are currently not supported",
    userMessage: "Please enter a valid email address.",
    category: "validation",
    severity: "medium",
  },
  weak_password: {
    code: "weak_password",
    description: "Password does not meet strength criteria",
    userMessage: "Password is too weak. Please choose a stronger password.",
    category: "validation",
    severity: "medium",
  },
  same_password: {
    code: "same_password",
    description:
      "User must use a different password than the one currently used",
    userMessage: "Please choose a different password from your current one.",
    category: "validation",
    severity: "medium",
  },

  // 频率限制错误
  over_request_rate_limit: {
    code: "over_request_rate_limit",
    description: "Too many requests have been sent by this client",
    userMessage: "Too many requests. Please try again in a few minutes.",
    category: "rate_limit",
    severity: "medium",
  },
  over_email_send_rate_limit: {
    code: "over_email_send_rate_limit",
    description: "Too many emails have been sent to this email address",
    userMessage:
      "Too many emails sent. Please wait a while before trying again.",
    category: "rate_limit",
    severity: "medium",
  },
  over_sms_send_rate_limit: {
    code: "over_sms_send_rate_limit",
    description: "Too many SMS messages have been sent to this phone number",
    userMessage:
      "Too many SMS messages sent. Please wait a while before trying again.",
    category: "rate_limit",
    severity: "medium",
  },
  too_many_requests: {
    code: "too_many_requests",
    description: "Rate limits are breached for an API",
    userMessage: "Too many attempts. Please wait a moment and try again.",
    category: "rate_limit",
    severity: "medium",
  },

  // 配置相关错误
  signup_disabled: {
    code: "signup_disabled",
    description: "Sign ups (new account creation) are disabled on the server",
    userMessage: "New account creation is currently disabled.",
    category: "config",
    severity: "high",
  },
  email_provider_disabled: {
    code: "email_provider_disabled",
    description: "Signups are disabled for email and password",
    userMessage: "Email registration is currently disabled.",
    category: "config",
    severity: "high",
  },
  phone_provider_disabled: {
    code: "phone_provider_disabled",
    description: "Signups are disabled for phone and password",
    userMessage: "Phone registration is currently disabled.",
    category: "config",
    severity: "high",
  },
  provider_disabled: {
    code: "provider_disabled",
    description: "OAuth provider is disabled for use",
    userMessage: "This sign-in method is currently disabled.",
    category: "config",
    severity: "high",
  },
  email_address_not_authorized: {
    code: "email_address_not_authorized",
    description: "Email sending is not allowed for this address",
    userMessage:
      "This email address is not authorized for registration. Please contact support.",
    category: "config",
    severity: "high",
  },

  // 服务器相关错误
  unexpected_failure: {
    code: "unexpected_failure",
    description: "Auth service is degraded or a bug is present",
    userMessage: "An unexpected error occurred. Please try again later.",
    category: "server",
    severity: "high",
  },
  internal_error: {
    code: "internal_error",
    description: "Internal server error occurred",
    userMessage: "An unexpected error occurred. Please try again later.",
    category: "server",
    severity: "high",
  },
  captcha_failed: {
    code: "captcha_failed",
    description: "CAPTCHA challenge could not be verified",
    userMessage: "Captcha verification failed. Please try again.",
    category: "validation",
    severity: "medium",
  },

  // OTP 相关错误
  otp_expired: {
    code: "otp_expired",
    description: "OTP code for this sign-in has expired",
    userMessage: "Verification code has expired. Please request a new one.",
    category: "auth",
    severity: "medium",
  },
  otp_disabled: {
    code: "otp_disabled",
    description: "Sign in with OTPs (magic link, email OTP) is disabled",
    userMessage: "Email verification is currently disabled.",
    category: "config",
    severity: "high",
  },

  // MFA 相关错误
  mfa_verification_failed: {
    code: "mfa_verification_failed",
    description: "MFA challenge could not be verified",
    userMessage: "Multi-factor authentication failed. Please try again.",
    category: "auth",
    severity: "medium",
  },
  insufficient_aal: {
    code: "insufficient_aal",
    description: "User must have a higher Authenticator Assurance Level",
    userMessage:
      "Additional authentication required. Please complete multi-factor authentication.",
    category: "auth",
    severity: "medium",
  },

  // 邀请相关错误
  invite_not_found: {
    code: "invite_not_found",
    description: "Invite is expired or already used",
    userMessage: "Invitation link is invalid or has expired.",
    category: "auth",
    severity: "medium",
  },

  // JWT 相关错误
  bad_jwt: {
    code: "bad_jwt",
    description: "JWT sent in the Authorization header is not valid",
    userMessage: "Authentication token is invalid. Please sign in again.",
    category: "auth",
    severity: "medium",
  },

  // 刷新令牌相关错误
  refresh_token_not_found: {
    code: "refresh_token_not_found",
    description: "Session containing the refresh token not found",
    userMessage: "Session expired. Please sign in again.",
    category: "auth",
    severity: "low",
  },
};

/**
 * 获取用户友好的错误信息
 */
export function getSupabaseErrorMessage(
  errorCode: string,
  fallbackMessage?: string
): string {
  const errorInfo = SUPABASE_ERROR_CODES[errorCode];
  if (errorInfo) {
    return errorInfo.userMessage;
  }
  return fallbackMessage || "An unexpected error occurred. Please try again.";
}

/**
 * 检查错误是否为特定类别
 */
export function isSupabaseErrorCategory(
  errorCode: string,
  category: SupabaseErrorCode["category"]
): boolean {
  const errorInfo = SUPABASE_ERROR_CODES[errorCode];
  return errorInfo?.category === category;
}

/**
 * 检查错误严重程度
 */
export function getSupabaseErrorSeverity(
  errorCode: string
): SupabaseErrorCode["severity"] {
  const errorInfo = SUPABASE_ERROR_CODES[errorCode];
  return errorInfo?.severity || "medium";
}

/**
 * 获取错误类别的所有错误代码
 */
export function getSupabaseErrorsByCategory(
  category: SupabaseErrorCode["category"]
): string[] {
  return Object.keys(SUPABASE_ERROR_CODES).filter(
    (code) => SUPABASE_ERROR_CODES[code].category === category
  );
}

/**
 * 处理 Supabase Auth 错误的工具函数
 */
export function handleSupabaseAuthError(error: any): {
  message: string;
  code?: string;
  category?: string;
  severity?: string;
} {
  if (error?.code && SUPABASE_ERROR_CODES[error.code]) {
    const errorInfo = SUPABASE_ERROR_CODES[error.code];
    return {
      message: errorInfo.userMessage,
      code: error.code,
      category: errorInfo.category,
      severity: errorInfo.severity,
    };
  }

  // 如果没有匹配的错误代码，返回原始信息或通用错误
  return {
    message:
      error?.message || "An unexpected error occurred. Please try again.",
    code: error?.code,
  };
}
