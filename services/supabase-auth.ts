import { createClient } from "@supabase/supabase-js";

// 创建Supabase客户端，用于认证
function getSupabaseAuthClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is not set");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
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
      console.error("Supabase auth error:", error);
      
      // 处理邮箱未验证错误
      if (
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("confirm your account") ||
        error.message?.includes("verify your account") ||
        error.message?.includes("verification") ||
        error.code === "email_not_confirmed"
      ) {
        throw new Error("EMAIL_NOT_CONFIRMED");
      }
      
      // 处理频率限制错误
      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("too many") ||
        error.code === "too_many_requests" ||
        error.code === "over_request_rate_limit"
      ) {
        throw new Error("Too many login attempts. Please wait a moment and try again.");
      }
      
      // 对于所有其他错误（包括 invalid_credentials），返回通用的友好消息
      throw new Error("Invalid email or password. Please check your credentials and try again.");
    }

    if (!data.user) {
      console.error("No user returned from Supabase");
      throw new Error("No user returned");
    }

    console.log("Login successful:", {
      userId: data.user.id,
      email: data.user.email,
      emailVerified: !!data.user.email_confirmed_at,
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
    console.error("Sign in error:", error);
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
      console.log("Using fallback user existence check");
      return await signUpWithEmailFallback(email, password, name);
    }

    if (checkError) {
      console.error("Error checking user existence:", checkError);
      throw checkError;
    }

    // 如果用户已存在，抛出错误
    if (existingUsers && existingUsers > 0) {
      console.log("User already exists, throwing error");
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
      console.error("Supabase signup error:", error);
      throw error;
    }

    console.log("New user registration successful:", {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: !!data.user?.email_confirmed_at,
    });

    return data;
  } catch (error) {
    console.error("Sign up error:", error);
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
