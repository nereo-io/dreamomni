import { checkReadingPermission } from "@/services/reading";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET() {

  const session = await auth()  // ✅ 服务端使用 auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const result = await checkReadingPermission(session.user);
    return respData(result);
  } catch (error) {
    console.error("Check reading permission failed:", error);
    return respErr("检查阅读权限失败");
  }
} 