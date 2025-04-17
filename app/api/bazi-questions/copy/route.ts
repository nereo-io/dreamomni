import { recordQuestionCopy } from "@/models/baziQuestions";
import { respData, respErr, respJson } from "@/lib/resp";

export async function POST(request: Request) {
  try {
    const { questionId, userId, ipAddress, deviceInfo } = await request.json();

    if (!questionId) {
      return respJson(-1, "问题ID是必需的");
    }

    // 记录复制行为
    await recordQuestionCopy(questionId, userId, ipAddress, deviceInfo);

    return respData({ success: true });
  } catch (error) {
    console.error("记录复制行为失败:", error);
    return respErr("记录复制行为失败");
  }
}
