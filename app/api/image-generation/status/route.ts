import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getImageGenerationById } from "@/models/imageGeneration";

import { NextRequest } from "next/server";

/**
 * 查询图片生成状态接口
 * POST /api/image-generation/status
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 2. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    // 3. 获取请求参数
    const { id } = await req.json();

    if (!id) {
      return respErr("Image generation ID is required");
    }

    // 4. 查询数据库记录
    const imageGeneration = await getImageGenerationById(id, userInfo.uuid);

    if (!imageGeneration) {
      return respErr("Image generation not found or access denied");
    }

    // 5. 构造响应数据
    const responseData = {
      id: imageGeneration.id,
      status: imageGeneration.status.toLowerCase(), // 转换为小写以匹配前端预期
      prompt: imageGeneration.prompt,
      model: imageGeneration.model_id,
      mode: imageGeneration.mode,
      image_url: imageGeneration.image_urls && imageGeneration.image_urls.length > 0 
        ? imageGeneration.image_urls[0] 
        : null,
      image_urls: imageGeneration.image_urls || [],
      image_count: imageGeneration.image_count || 0,
      credits_used: imageGeneration.credits_used,
      error_message: imageGeneration.error_message,
      created_at: imageGeneration.created_at,
      updated_at: imageGeneration.updated_at,
      completed_at: imageGeneration.completed_at,
      metadata: imageGeneration.metadata,
    };

    return respData(responseData);

  } catch (error) {
    console.error("Get image generation status error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

/**
 * 批量查询图片生成状态接口 (可选扩展)
 * GET /api/image-generation/status?ids=id1,id2,id3
 */
export async function GET(req: NextRequest) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 2. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    // 3. 获取查询参数
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return respErr("Image generation IDs are required");
    }

    const ids = idsParam.split(',').filter(id => id.trim());

    if (ids.length === 0) {
      return respErr("Valid image generation IDs are required");
    }

    if (ids.length > 50) {
      return respErr("Too many IDs requested (maximum 50)");
    }

    // 4. 批量查询数据库记录
    const results = [];
    
    for (const id of ids) {
      try {
        const imageGeneration = await getImageGenerationById(id.trim(), userInfo.uuid);
        
        if (imageGeneration) {
          results.push({
            id: imageGeneration.id,
            status: imageGeneration.status.toLowerCase(),
            prompt: imageGeneration.prompt,
            model: imageGeneration.model_id,
            mode: imageGeneration.mode,
            image_url: imageGeneration.image_urls && imageGeneration.image_urls.length > 0 
              ? imageGeneration.image_urls[0] 
              : null,
            image_urls: imageGeneration.image_urls || [],
            image_count: imageGeneration.image_count || 0,
            credits_used: imageGeneration.credits_used,
            error_message: imageGeneration.error_message,
            created_at: imageGeneration.created_at,
            updated_at: imageGeneration.updated_at,
            completed_at: imageGeneration.completed_at,
          });
        }
      } catch (error) {
        console.error(`Error fetching image generation ${id}:`, error);
        // 跳过有错误的ID，继续处理其他ID
      }
    }

    return respData({
      results,
      total: results.length,
      requested: ids.length,
    });

  } catch (error) {
    console.error("Batch get image generation status error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

// 不支持其他 HTTP 方法
export async function PUT() {
  return new Response("Method not allowed", { status: 405 });
}

export async function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}
