import { ReadingRecord } from "@/types/reading";
import { getSupabaseClient } from "./db";

// 获取用户今日阅读次数
export async function getTodayReadingCount(user_uuid: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("reading_records")
    .select("count")
    .eq("user_uuid", user_uuid)
    .eq("read_date", today)
    .single();

  if (error) {
    return 0;
  }

  return data.count;
}

// 更新或创建阅读记录
export async function updateReadingCount(user_uuid: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const supabase = getSupabaseClient();

  // 先尝试获取今天的记录
  const { data: existingRecord } = await supabase
    .from("reading_records")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("read_date", today)
    .single();

  if (!existingRecord) {
    // 创建新记录
    const { data, error } = await supabase
      .from("reading_records")
      .insert({
        user_uuid,
        read_date: today,
        count: 1
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.count;
  } else {
    // 更新现有记录
    const newCount = existingRecord.count + 1;
    const { data, error } = await supabase
      .from("reading_records")
      .update({ count: newCount, updated_at: new Date().toISOString() })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.count;
  }
} 