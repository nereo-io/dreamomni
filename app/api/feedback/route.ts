import { NextRequest, NextResponse } from "next/server";
import { CreateFeedbackInput } from "@/types/feedback";
import { createFeedback } from "@/models/feedback";
import { getUserUuid } from "@/services/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证请求数据
    if (!body.feedbackType || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 获取当前用户ID（如果已登录）
    const userUuid = await getUserUuid();

    // 准备反馈数据
    const feedbackData: CreateFeedbackInput = {
      feedback_type: body.feedbackType,
      content: body.content,
      user_id: userUuid || undefined,
      email: body.email,
    };

    // 创建反馈
    const feedback = await createFeedback(feedbackData);

    if (!feedback) {
      return NextResponse.json(
        { error: "Failed to create feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        data: feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
