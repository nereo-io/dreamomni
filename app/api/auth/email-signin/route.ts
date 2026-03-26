import { NextRequest, NextResponse } from "next/server";
import { signInWithEmail } from "@/services/supabase-auth";
import { z } from "zod";
import { getSupabaseErrorMessage } from "@/lib/supabase-error-codes";

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
    // Service层已经记录了日志，这里只处理响应
    if (error.code === "email_not_confirmed") {
      return NextResponse.json(
        { 
          error: "email_not_confirmed",
          message: getSupabaseErrorMessage("email_not_confirmed"),
          email: email
        },
        { status: 403 }
      );
    }

    if (
      error.code === "too_many_requests" ||
      error.code === "over_request_rate_limit"
    ) {
      return NextResponse.json(
        {
          error: error.code,
          message: getSupabaseErrorMessage(error.code),
        },
        { status: 429 }
      );
    }

    if (error.code === "user_not_found") {
      return NextResponse.json(
        {
          error: error.code,
          message: getSupabaseErrorMessage(error.code),
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.code || "invalid_credentials",
        message:
          error.message ||
          getSupabaseErrorMessage("invalid_credentials"),
      },
      { status: 401 }
    );
  }
}
