import { createClient } from "@supabase/supabase-js";
import { logger, Logger, LogCategory } from "@/lib/logger";
import { getSupabaseErrorMessage } from "@/lib/supabase-error-codes";

// 创建Supabase客户端，用于认证
function getSupabaseAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * 邮箱密码登录
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabaseAuthClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const normalizedCode =
        error.code ||
        (error.message?.includes("Email not confirmed") ||
        error.message?.includes("confirm your account") ||
        error.message?.includes("verify your account") ||
        error.message?.includes("verification")
          ? "email_not_confirmed"
          : undefined);

      // 根据错误类型决定日志级别
      if (Logger.isSystemError(error)) {
        logger.error(LogCategory.AUTH, "Supabase authentication system error", 
          { email, action: "signin" }, error);
      } else if (error.message?.includes("rate limit") || 
                 error.message?.includes("too many")) {
        logger.warn(LogCategory.AUTH, "Rate limit exceeded", 
          { email, action: "signin" });
      } else {
        // 用户错误（密码错误等）只记录INFO级别
        logger.info(LogCategory.AUTH, "Authentication attempt failed", 
          {
            email,
            action: "signin",
            metadata: {
              reason: normalizedCode || "invalid_credentials",
              rawMessage: error.message,
            },
          });
      }

      const mappedCode =
        normalizedCode ||
        (error.message?.includes("rate limit") || error.message?.includes("too many")
          ? "too_many_requests"
          : "invalid_credentials");

      const authError = new Error(
        getSupabaseErrorMessage(mappedCode, error.message)
      ) as Error & {
        code?: string;
        originalMessage?: string;
      };

      authError.code = mappedCode;
      authError.originalMessage = error.message;

      throw authError;
    }

    if (!data.user) {
      logger.error(LogCategory.AUTH, "No user returned from Supabase", 
        { email, action: "signin" });
      throw new Error("No user returned");
    }

    logger.info(LogCategory.AUTH, "Login successful", {
      userId: data.user.id,
      email: data.user.email,
      action: "signin",
      metadata: { emailVerified: !!data.user.email_confirmed_at }
    });

    // 返回符合NextAuth用户格式的数据
    return {
      id: data.user.id,
      email: data.user.email || "",
      name:
        data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
      image: data.user.user_metadata?.avatar_url || "",
      emailVerified: data.user.email_confirmed_at
        ? new Date(data.user.email_confirmed_at)
        : null,
    };
  } catch (error) {
    // 错误已经在上面记录过了，这里不再重复记录
    // 只是简单地向上传递错误
    throw error;
  }
}

/**
 * 邮箱注册
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
) {
  try {
    const supabase = getSupabaseAuthClient();

    // 首先检查用户是否已经存在
    // 使用服务端函数查询 auth.users 表
    const { data: existingUsers, error: checkError } = await supabase.rpc(
      "check_user_exists_by_email",
      { user_email: email }
    );

    // 如果RPC函数不存在，我们fallback到原有的逻辑
    if (
      checkError &&
      checkError.message?.includes(
        'function "check_user_exists_by_email" does not exist'
      )
    ) {
      logger.debug(LogCategory.AUTH, "Using fallback user existence check", 
        { email, action: "signup" });
      return await signUpWithEmailFallback(email, password, name);
    }

    if (checkError) {
      logger.error(LogCategory.AUTH, "Error checking user existence", 
        { email, action: "signup" }, checkError);
      throw checkError;
    }

    // 如果用户已存在，抛出错误
    if (existingUsers && existingUsers > 0) {
      logger.info(LogCategory.AUTH, "Signup attempt for existing user", 
        { email, action: "signup_blocked", metadata: { reason: "user_exists" } });
      throw new Error("User already registered");
    }

    // 用户不存在，进行正常注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
        emailRedirectTo: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/auth/signin?verified=true`,
      },
    });

    if (error) {
      // 根据错误类型决定日志级别
      if (Logger.isSystemError(error)) {
        logger.error(LogCategory.AUTH, "Supabase signup system error", 
          { email, action: "signup" }, error);
      } else {
        logger.info(LogCategory.AUTH, "Signup failed", 
          { email, action: "signup", metadata: { reason: error.code || error.message } });
      }
      throw error;
    }

    logger.info(LogCategory.AUTH, "New user registration successful", {
      userId: data.user?.id,
      email: data.user?.email,
      action: "signup",
      metadata: { emailConfirmed: !!data.user?.email_confirmed_at }
    });

    return data;
  } catch (error) {
    // 错误已经在上面记录，不再重复
    throw error;
  }
}

/**
 * 邮箱注册的备用方法（当数据库函数不可用时）
 */
async function signUpWithEmailFallback(
  email: string,
  password: string,
  name?: string
) {
  const supabase = getSupabaseAuthClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
      emailRedirectTo: `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/auth/signin?verified=true`,
    },
  });

  if (error) {
    console.error("Supabase signup error:", error);
    throw error;
  }

  // 使用改进的检测逻辑
  if (data.user) {
    // 检查1: identities数组为空 = 已确认的现有用户
    const hasNoIdentities =
      !data.user.identities || data.user.identities.length === 0;

    // 检查2: 没有session但有用户对象 = 可能是现有用户
    const hasNoSession = !data.session;

    // 检查3: 用户已经验证过邮箱 = 现有用户
    const isEmailConfirmed = !!data.user.email_confirmed_at;

    console.log("Fallback signup response analysis:", {
      userId: data.user.id,
      email: data.user.email,
      hasNoIdentities,
      hasNoSession,
      isEmailConfirmed,
      identitiesLength: data.user.identities?.length,
    });

    // 如果满足现有用户的条件，抛出错误
    if (hasNoIdentities || (hasNoSession && isEmailConfirmed)) {
      console.log("Detected existing user, throwing error");
      throw new Error("User already registered");
    }
  }

  return data;
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const supabase = getSupabaseAuthClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/auth/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Send password reset error:", error);
    throw error;
  }
}

/**
 * 重新发送验证邮件
 */
export async function resendVerificationEmail(email: string) {
  try {
    const supabase = getSupabaseAuthClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/auth/signin?verified=true`,
      },
    });

    if (error) {
      console.error("Resend verification error:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Resend verification email error:", error);
    throw error;
  }
}
