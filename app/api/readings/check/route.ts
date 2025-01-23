import { checkReadingPermission } from "@/services/reading";
import { respData, respErr } from "@/lib/resp";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await checkReadingPermission();
    return respData(result);
  } catch (error) {
    console.error("Check reading permission failed:", error);
    return respErr("检查阅读权限失败");
  }
} 