import { NextRequest, NextResponse } from 'next/server';
import { calculateImageCredits } from '@/config/image-models';

/**
 * 内部 API: 图像生成
 * 简化版 - 直接转发到现有的 submit API
 */
export async function POST(req: NextRequest) {
  // 验证内部调用
  const authHeader = req.headers.get('Authorization');
  const internalKey = process.env.INTERNAL_API_KEY?.trim();
  if (!internalKey) {
    return NextResponse.json(
      { error: 'INTERNAL_API_KEY is not configured' },
      { status: 500 }
    );
  }
  const expectedKey = `Bearer ${internalKey}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 用于在 catch 块中访问已创建的记录 ID
  let createdGenerationId: string | null = null;

  try {
    const body = await req.json();
    const { userId, prompt, referenceImage, model, aspectRatio, aspect_ratio, resolution, agentShotId } = body;
    const resolvedAspectRatio = aspectRatio || aspect_ratio;

    // 参数验证
    if (!userId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, prompt' },
        { status: 400 }
      );
    }

    // 调用现有的图像生成模型层
    const { createImageGeneration, updateImageGenerationById } = await import('@/models/imageGeneration');
    const { aiServiceManager } = await import('@/services/AIServiceManager');

    const modelAliasMap: Record<string, string> = {
      seedream: 'seedream-4-5',
    };
    const selectedModel = modelAliasMap[model] || model || 'nano-banana';
    const provider =
      aiServiceManager.getProviderByModelId(selectedModel) || ('nano_banana' as const);
    const creditsUsed = calculateImageCredits(selectedModel, resolution);

    console.log('[Internal Image Gen] Provider:', provider, 'Model:', selectedModel, 'UserId:', userId);
    console.log('[Internal Image Gen] Available providers:', aiServiceManager.getAvailableProviders());

    // 检查 provider 是否可用
    const providerInstance = aiServiceManager.getProvider(provider);
    console.log('[Internal Image Gen] Provider instance:', providerInstance ? 'found' : 'null');

    if (!providerInstance) {
      const error = `Provider ${provider} not available. Available: ${aiServiceManager.getAvailableProviders().join(', ')}`;
      console.error('[Internal Image Gen]', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    // 处理参考图片数组（过滤空值，确保只有有效 URL）
    const referenceImages = referenceImage
      ? (Array.isArray(referenceImage)
          ? referenceImage.filter(Boolean)
          : [referenceImage].filter(Boolean)
        ).filter(url => url && url.trim())  // 进一步过滤空字符串
      : undefined;

    // 判断是否有有效的参考图片
    const hasValidReferenceImages = referenceImages && referenceImages.length > 0;

    // 先创建数据库记录（在 API 调用之前，确保内部回调可以找到记录）
    const imageGeneration = await createImageGeneration({
      user_id: userId,
      provider: provider,
      model_id: selectedModel,
      prompt: prompt,
      mode: hasValidReferenceImages ? 'image-to-image' : 'text-to-image',
      source: 'api',
      status: 'IN_PROGRESS',
      input_image_urls: hasValidReferenceImages ? referenceImages : undefined,
      aspect_ratio: resolvedAspectRatio,
      credits_used: creditsUsed,
      agent_shot_id: agentShotId,
    });

    // 保存 ID 以便在 catch 中访问
    createdGenerationId = imageGeneration.id;
    console.log('[Internal Image Gen] Pre-created record:', imageGeneration.id);

    // 调用 AI 服务 - 根据是否有有效参考图片选择方法
    let result;
    if (hasValidReferenceImages) {
      // Image-to-Image: 使用 editImage 方法
      console.log('[Internal Image Gen] Using image-to-image mode with references:', referenceImages);
      result = await aiServiceManager.editImage(provider, {
        prompt: prompt,
        imageUrls: referenceImages,
        model: selectedModel,
        aspect_ratio: resolvedAspectRatio,
        resolution: resolution,
        output_format: 'png',
        generationId: imageGeneration.id,
        isAgentMode: false
      });
    } else {
      // Text-to-Image: 使用 generateImage 方法
      console.log('[Internal Image Gen] Using text-to-image mode');
      result = await aiServiceManager.generateImage(provider, {
        prompt: prompt,
        model: selectedModel,
        aspect_ratio: resolvedAspectRatio,
        resolution: resolution,
        count: 1,
        output_format: 'png',
        generationId: imageGeneration.id,
        isAgentMode: false
      });
    }

    // 检查结果 (ProviderResponse 没有 success 字段,检查 status 和 taskId)
    const firstImage = result.images?.[0];
    if (result.status === 'failed' || (!result.taskId && !firstImage)) {
      // 更新记录为失败状态
      await updateImageGenerationById(imageGeneration.id, {
        status: 'FAILED',
        error_message: result.error || 'Image generation failed'
      });
      throw new Error(result.error || 'Image generation failed');
    }

    // 根据返回状态处理
    if (result.status === 'completed' && firstImage) {
      // 同步完成模式（Seedream）- 内部回调已上传到 R2，从数据库获取 R2 URL
      const { getImageGenerationById } = await import('@/models/imageGeneration');
      const updatedRecord = await getImageGenerationById(imageGeneration.id);

      // 优先使用 R2 URL，fallback 到原始 URL
      const imageUrl = updatedRecord?.image_urls_r2?.[0]
        || updatedRecord?.image_urls?.[0]
        || firstImage.url;

      return NextResponse.json({
        success: true,
        taskId: result.taskId,
        imageGenerationId: imageGeneration.id,
        status: 'completed',
        imageUrl: imageUrl
      });
    } else {
      // 异步模式（nano_banana 等）- 更新状态为 IN_QUEUE
      await updateImageGenerationById(imageGeneration.id, {
        provider_task_id: result.taskId,
        status: 'IN_QUEUE'
      });

      return NextResponse.json({
        success: true,
        taskId: result.taskId,
        imageGenerationId: imageGeneration.id,
        status: 'pending'
      });
    }

  } catch (error: any) {
    console.error('Internal image generation error:', error);

    // 如果记录已创建但 API 调用异常，更新记录为失败状态
    if (createdGenerationId) {
      try {
        const { updateImageGenerationById } = await import('@/models/imageGeneration');
        await updateImageGenerationById(createdGenerationId, {
          status: 'FAILED',
          error_message: error.message || 'Image generation failed'
        });
        console.log(`[Internal Image Gen] Updated record ${createdGenerationId} to FAILED`);
      } catch (updateError) {
        console.error('[Internal Image Gen] Failed to update record status:', updateError);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

/**
 * 查询图像生成状态
 */
export async function GET(req: NextRequest) {
  // 验证内部调用
  const authHeader = req.headers.get('Authorization');
  const internalKey = process.env.INTERNAL_API_KEY?.trim();
  if (!internalKey) {
    return NextResponse.json(
      { error: 'INTERNAL_API_KEY is not configured' },
      { status: 500 }
    );
  }
  const expectedKey = `Bearer ${internalKey}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const imageGenerationId = searchParams.get('id');

  if (!imageGenerationId) {
    return NextResponse.json(
      { error: 'Missing query parameter: id' },
      { status: 400 }
    );
  }

  try {
    const { getImageGenerationById } = await import('@/models/imageGeneration');
    const imageGen = await getImageGenerationById(imageGenerationId);

    if (!imageGen) {
      return NextResponse.json(
        { error: 'Image generation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: imageGen.id,
      status: imageGen.status,
      imageUrl: imageGen.image_urls_r2?.[0] || imageGen.image_urls?.[0],
      errorMessage: imageGen.error_message
    });

  } catch (error: any) {
    console.error('Query image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query image generation' },
      { status: 500 }
    );
  }
}
