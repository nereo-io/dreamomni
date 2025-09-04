import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getImageGenerationById, updateImageGenerationById } from "@/models/imageGeneration";
import { AIServiceManager } from "@/services/AIServiceManager";

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
    let imageGeneration = await getImageGenerationById(id, userInfo.uuid);

    if (!imageGeneration) {
      return respErr("Image generation not found or access denied");
    }

    // 5. 尝试从AI服务提供商同步最新状态（仅当状态未完成时）
    const incompleteStatuses = ["PENDING", "PROMPT_OPTIMIZING", "IN_QUEUE", "IN_PROGRESS"];
    const shouldSync = incompleteStatuses.includes(imageGeneration.status.toUpperCase()) && 
                       imageGeneration.task_id && 
                       imageGeneration.provider;

    if (shouldSync) {
      try {
        console.log(`🔄 Syncing status from AI service for image ${imageGeneration.id}, taskId: ${imageGeneration.task_id}`);
        
        const aiServiceManager = AIServiceManager.getInstance();
        const statusResult = await aiServiceManager.getTaskStatus(
          imageGeneration.provider as any,
          imageGeneration.task_id!
        );

        console.log(`📊 Received status from AI service:`, statusResult);

        // 如果从AI服务获取到新状态，更新数据库
        if (statusResult && statusResult.status) {
          const updateParams: any = {
            status: statusResult.status.toUpperCase(),
          };

          // 如果有图片结果，更新图片URL
          if (statusResult.images && statusResult.images.length > 0) {
            const imageUrls = statusResult.images.map(img => img.url).filter(Boolean);
            if (imageUrls.length > 0) {
              updateParams.image_urls = imageUrls;
            }
          }

          // 如果有错误信息，也更新
          if (statusResult.error) {
            updateParams.error_message = statusResult.error;
          }

          console.log(`💾 Updating database with new status:`, updateParams);
          
          const updatedGeneration = await updateImageGenerationById(imageGeneration.id, updateParams);
          if (updatedGeneration) {
            imageGeneration = updatedGeneration;
            console.log(`✅ Status updated successfully: ${imageGeneration.status}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to sync status from AI service:`, error);
        // 即使同步失败，也继续返回数据库中的状态
      }
    }

    // 6. 构造响应数据
    const responseData = {
      id: imageGeneration.id,
      status: imageGeneration.status.toLowerCase(), // 转换为小写以匹配前端预期
      prompt: imageGeneration.prompt,
      optimized_prompt: imageGeneration.optimized_prompt, // 添加优化后的提示词
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
