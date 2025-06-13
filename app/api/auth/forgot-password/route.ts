import { NextRequest } from "next/server";
import { respJson, respErr } from "@/lib/resp";
import { sendPasswordResetEmail } from "@/services/supabase-auth";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return respErr(validation.error.errors[0].message);
    }

    const { email } = validation.data;

    // 发送密码重置邮件
    await sendPasswordResetEmail(email);

    return respJson(0, "Password reset email sent. Please check your inbox.", {
      success: true
    });

  } catch (error: any) {
    console.error("Forgot password error:", error);
    
    // 安全考虑：即使邮箱不存在也返回成功消息
    // 避免泄露用户是否存在的信息
    return respJson(0, "If an account with that email exists, we've sent a password reset link.", {
      success: true
    });
  }
}