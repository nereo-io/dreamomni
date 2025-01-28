import { recordReading } from "@/services/reading";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth()  // ✅ 服务端使用 auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const result = await recordReading(session.user);
    return respData(result);
  } catch (error) {
    console.error("Create reading record failed:", error);
    return respErr(error instanceof Error ? error.message : "创建阅读记录失败");
  }
} 