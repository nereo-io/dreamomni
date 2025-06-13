import { NextRequest } from "next/server";
import { respJson, respErr } from "@/lib/resp";
import { resendVerificationEmail } from "@/services/supabase-auth";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return respErr(validation.error.errors[0].message);
    }

    const { email } = validation.data;

    // 重新发送验证邮件
    await resendVerificationEmail(email);

    return respJson(0, "Verification email sent. Please check your inbox.", {
      success: true
    });

  } catch (error: any) {
    console.error("Resend verification error:", error);
    
    // 安全考虑：即使邮箱不存在也返回成功消息
    return respJson(0, "If an account with that email exists, we've sent a verification email.", {
      success: true
    });
  }
}