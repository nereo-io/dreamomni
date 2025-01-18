import { recordReading } from "@/services/reading";
import { respData, respErr } from "@/lib/resp";

export async function POST() {
  try {
    const result = await recordReading();
    return respData(result);
  } catch (error) {
    console.error("Create reading record failed:", error);
    return respErr(error instanceof Error ? error.message : "创建阅读记录失败");
  }
} 