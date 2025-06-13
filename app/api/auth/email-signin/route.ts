import { NextRequest, NextResponse } from "next/server";
import { signInWithEmail } from "@/services/supabase-auth";
import { z } from "zod";

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  let email = "";
  
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validation = signinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email: validatedEmail, password } = validation.data;
    email = validatedEmail; // 保存email以便在catch块中使用

    // 尝试登录
    const user = await signInWithEmail(email, password);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error: any) {
    console.error("Email signin error:", error);
    
    // 处理特殊错误类型
    if (error.message === "EMAIL_NOT_CONFIRMED") {
      return NextResponse.json(
        { 
          error: "email_not_confirmed",
          message: "Please check your email and click the verification link to activate your account before signing in.",
          email: email
        },
        { status: 403 }
      );
    }
    
    // 处理其他错误
    return NextResponse.json(
      { 
        error: "invalid_credentials",
        message: error.message || "Invalid email or password. Please check your credentials and try again."
      },
      { status: 401 }
    );
  }
}