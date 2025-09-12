import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { saveUser } from "@/services/user";
import { findUserByUuid } from "@/models/user";
import { NextRequest } from "next/server";

/**
 * 用户同步API - 修复用户数据不一致问题
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户认证
    const session = await auth();
    if (!session?.user?.uuid || !session?.user?.email) {
      return respErr("User not authenticated or missing required fields");
    }

    console.log("🔄 Starting user sync for UUID:", session.user.uuid);

    // 2. 检查用户是否已存在
    const existingUser = await findUserByUuid(session.user.uuid);
    
    if (existingUser) {
      console.log("✅ User already exists in database:", existingUser.uuid);
      return respData({
        action: "verified",
        user: existingUser,
        message: "User already exists and is properly synchronized",
      });
    }

    // 3. 用户不存在，从 session 重新创建
    console.log("🔧 User not found, recreating from session...");
    
    const sessionUser = {
      uuid: session.user.uuid,
      email: session.user.email,
      nickname: session.user.name || session.user.email,
      avatar_url: session.user.image || "",
      signin_provider: "sync_recovery",
    };

    // 4. 保存用户（会自动处理新用户流程）
    const savedUser = await saveUser(sessionUser);
    
    console.log("✅ User recreated successfully:", savedUser.uuid);

    return respData({
      action: "recreated",
      user: savedUser,
      message: "User successfully recreated and synchronized",
    });

  } catch (error) {
    console.error("❌ User sync failed:", error);
    return respErr(
      error instanceof Error 
        ? `Sync failed: ${error.message}` 
        : "User synchronization failed"
    );
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
