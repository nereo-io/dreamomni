import { NextResponse } from "next/server";
import {
  getChatMessagesByChatSessionId,
  createOrUpdateChatMessage,
} from "@/models/chat";

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { data, error } = await getChatMessagesByChatSessionId(params.chatId);

    if (error) {
      throw new Error(error);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const message = await request.json();

    const result = await createOrUpdateChatMessage({
      session_id: params.chatId,
      role: message.role,
      content: message.content,
      reasoning_content: message.reasoning_content,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
