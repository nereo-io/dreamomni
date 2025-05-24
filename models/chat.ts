import { ChatMessage, ChatSession, ChatStatus } from "@/types/chat.d";
import { getSupabaseClient } from "./db";
import { respOk } from "@/lib/resp";

// 创建聊天会话
export async function createChatSession(data: ChatSession) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from("chat_sessions")
    .upsert({
      uuid: data.uuid,
      user_uuid: data.user_uuid,
      title: data.title,
      status: data.status,
      model: data.model,
    })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return result as ChatSession;
}

export async function getChatSessionList(page: number, pageSize: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) {
    throw error;
  }
  return data as ChatSession[];
}

// 根据ID获取聊天会话信息
export async function getChatSessionByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("uuid", uuid)
    .single();
  if (error) {
    throw error;
  }
  return data as ChatSession;
}

// 根据用户ID获取聊天会话列表
export async function getChatSessionsByUserId(userUuid: string) {
  const supabase = getSupabaseClient();
  console.log("查询用户聊天会话，用户UUID:", userUuid);

  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_uuid", userUuid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("获取聊天会话列表失败:", error);
      throw error;
    }

    console.log(`找到 ${data?.length || 0} 条聊天会话记录`);
    return data as ChatSession[];
  } catch (error) {
    console.error("获取聊天会话列表异常:", error);
    throw error;
  }
}

// 根据UUID删除聊天会话
export async function deleteChatSessionByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("uuid", uuid);
  if (error) {
    throw error;
  }
  return respOk();
}

// 创建/更新聊天消息
export async function createOrUpdateChatMessage(data: ChatMessage) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from("chat_messages")
    .upsert(data)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return result as ChatMessage;
}

// 根据chat_session_id获取聊天消息列表
export async function getChatMessagesByChatSessionId(
  chatSessionId: string
): Promise<{
  data: ChatMessage[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", chatSessionId)
    .order("created_at", { ascending: true });

  if (error) {
    // 如果是 "not found" 错误，返回空数组而不是错误
    if (error.code === "PGRST116") {
      return {
        data: [],
        error: null,
      };
    }
    // 其他错误情况
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data as ChatMessage[],
    error: null,
  };
}

export async function updateChatSessionStatus(
  uuid: string,
  status: ChatStatus
): Promise<ChatSession | null> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("uuid", uuid)
      .select()
      .single();

    if (error) {
      console.error("Error updating chat session status:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update chat session status:", error);
    throw error;
  }
}

// 更新聊天会话标题
export async function updateChatSessionTitle(
  uuid: string,
  title: string
): Promise<ChatSession | null> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("uuid", uuid)
      .select()
      .single();

    if (error) {
      console.error("Error updating chat session title:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update chat session title:", error);
    throw error;
  }
}
