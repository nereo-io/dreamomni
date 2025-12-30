import { NextRequest, NextResponse } from 'next/server';
import { calculateImageCredits } from '@/config/image-models';

/**
 * 内部 API: 图像生成
 * 简化版 - 直接转发到现有的 submit API
 */
export async function POST(req: NextRequest) {
  // 验证内部调用
  const authHeader = req.headers.get('Authorization');
  const expectedKey = `Bearer ${process.env.INTERNAL_API_KEY}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, prompt, referenceImage, model, aspectRatio, aspect_ratio, resolution } = body;
    const resolvedAspectRatio = aspectRatio || aspect_ratio;

    // 参数验证
    if (!userId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, prompt' },
        { status: 400 }
      );
    }

    // 调用现有的图像生成模型层
    const { createImageGeneration } = await import('@/models/imageGeneration');
    const { aiServiceManager } = await import('@/services/AIServiceManager');

    // 确定 provider
    const provider = 'nano_banana' as const;
    const selectedModel = model || 'nano-banana';
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

    // 调用 AI 服务 - 根据是否有参考图片选择方法
    // referenceImage 支持 string 或 string[]
    let result;
    if (referenceImage) {
      const referenceImages = Array.isArray(referenceImage)
        ? referenceImage.filter(Boolean)
        : [referenceImage];

      // Image-to-Image: 使用 editImage 方法
      console.log('[Internal Image Gen] Using image-to-image mode with references:', referenceImages);
      result = await aiServiceManager.editImage(provider, {
        prompt: prompt,
        imageUrls: referenceImages,
        model: selectedModel,
        aspect_ratio: resolvedAspectRatio,
        output_format: 'png'
      });
    } else {
      // Text-to-Image: 使用 generateImage 方法
      console.log('[Internal Image Gen] Using text-to-image mode');
      result = await aiServiceManager.generateImage(provider, {
        prompt: prompt,
        model: selectedModel,
        aspect_ratio: resolvedAspectRatio,
        count: 1,
        output_format: 'png'
      });
    }

    // 检查结果 (ProviderResponse 没有 success 字段,检查 status 和 taskId)
    const firstImage = result.images?.[0];
    if (result.status === 'failed' || (!result.taskId && !firstImage)) {
      throw new Error(result.error || 'Image generation failed');
    }

    // 创建数据库记录
    const imageGeneration = await createImageGeneration({
      user_id: userId,
      provider: provider,
      model_id: selectedModel,
      prompt: prompt,
      mode: referenceImage ? 'image-to-image' : 'text-to-image',
      source: 'api',
      task_id: result.taskId,
      provider_task_id: result.taskId,
      status: result.taskId ? 'IN_QUEUE' : 'PENDING',
      input_image_urls: referenceImage
        ? Array.isArray(referenceImage)
          ? referenceImage
          : [referenceImage]
        : undefined,
      aspect_ratio: resolvedAspectRatio,
      credits_used: creditsUsed
    });

    // 返回结果
    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      imageGenerationId: imageGeneration.id,
      status: result.status || 'pending',
      // 如果是同步返回图片,直接返回
      imageUrl: firstImage?.url || undefined
    });

  } catch (error: any) {
    console.error('Internal image generation error:', error);

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
  const expectedKey = `Bearer ${process.env.INTERNAL_API_KEY}`;

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
