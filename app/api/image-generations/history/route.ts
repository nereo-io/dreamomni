import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getUserImageGenerations } from "@/models/imageGeneration";

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 可选的状态筛选

    // 验证参数
    if (page < 1) {
      return respErr("Page must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      return respErr("Limit must be between 1 and 100");
    }

    const offset = (page - 1) * limit;

    console.log(`📊 Fetching image history for user ${userInfo.uuid}, page ${page}, limit ${limit}`);

    // 查询数据库
    const result = await getUserImageGenerations(userInfo.uuid, limit, offset);
    let historyItems = result.data;
    
    let total = result.total;

    // 按状态筛选 (如果指定)
    if (status) {
      historyItems = historyItems.filter(item => 
        item.status.toLowerCase() === status.toLowerCase()
      );
    }

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log(`✅ Found ${historyItems.length} history items (total: ${total})`);

    // 格式化响应数据 - 直接返回数组以匹配组件期望
    const formattedData = historyItems.map(item => ({
      id: item.id,
      prompt: item.prompt,
      optimized_prompt: item.optimized_prompt,
      image_url: Array.isArray(item.image_urls) && item.image_urls.length > 0 
        ? item.image_urls[0] 
        : undefined,
      image_url_r2: Array.isArray(item.image_urls_r2) && item.image_urls_r2.length > 0 
        ? item.image_urls_r2[0]
        : undefined,
      input_image_urls: item.input_image_urls, // 添加输入图片URLs
      status: item.status.toLowerCase(),
      model: item.model_id,
      image_size: item.metadata?.image_size || '1:1', // 解析metadata中的image_size
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      credits_used: item.credits_used,
      error_message: item.error_message,
      provider: item.provider,
      mode: item.mode,
    }));

    // 返回数组格式以匹配组件期望
    return respData(formattedData);

  } catch (error) {
    console.error("Fetch image history error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

export async function POST() {
  return new Response("Method not allowed", { status: 405 });
}
