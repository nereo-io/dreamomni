import { NextRequest, NextResponse } from 'next/server';
import {
  calculateCredits,
  getVideoModel,
  VideoModelProvider,
  isSora2Model,
} from '@/config/video-models';
import {
  CreditsTransType,
  decreaseCredits,
  getUserCredits,
  increaseCredits,
} from '@/services/credit';

/**
 * 内部 API: 视频生成
 * 用于 Python Agent 生成视频片段
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
    const { userId, prompt, imageUrl, duration, model, aspectRatio, aspect_ratio, resolution } = body;

    // 参数验证
    if (!userId || !prompt || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, prompt, imageUrl' },
        { status: 400 }
      );
    }

    // 动态导入服务
    const { ProviderFactory } = await import('@/services/providers/ProviderFactory');
    const { createVideoGeneration } = await import('@/models/videoGeneration');

    // 确定模型ID (默认 kie-veo3-image-to-video)
    const modelId = model || 'kie-veo3-image-to-video';
    const durationSeconds = Number(duration ?? 8);
    const resolvedAspectRatio = aspectRatio || aspect_ratio || '16:9';
    const resolvedResolution = resolution || '1080p';
    const modelConfig = getVideoModel(modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `不支持的模型: ${modelId}` },
        { status: 400 }
      );
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      );
    }
    if (!modelConfig.supportedDurations?.includes(durationSeconds)) {
      return NextResponse.json(
        {
          error: `${modelId} 模型不支持 ${durationSeconds} 秒时长，支持的时长: ${modelConfig.supportedDurations?.join(
            ', '
          )} 秒`,
        },
        { status: 400 }
      );
    }
    // 部分提供商需要实际的 API 模型 ID（如 BytePlus/Volcano 使用 endpoint ID）
    const providerModelId =
      modelConfig?.provider === VideoModelProvider.BYTEPLUS ||
      modelConfig?.provider === VideoModelProvider.VOLCANO
        ? modelConfig?.volcanoModel || modelId
        : modelId;

    const requiredCredits = calculateCredits(
      modelId,
      durationSeconds,
      false,
      resolvedResolution
    );
    if (requiredCredits === 0) {
      return NextResponse.json(
        { error: 'Unable to calculate required credits' },
        { status: 400 }
      );
    }

    const userCredits = await getUserCredits(userId);
    if (!userCredits) {
      return NextResponse.json(
        { error: 'Failed to get user credits' },
        { status: 500 }
      );
    }
    if (userCredits.left_credits < requiredCredits) {
      return NextResponse.json(
        {
          error: `积分不足，需要 ${requiredCredits} 积分，当前剩余 ${userCredits.left_credits} 积分`,
        },
        { status: 400 }
      );
    }

    let transType: CreditsTransType;
    if (durationSeconds === 5) {
      transType = CreditsTransType.VideoGeneration5s;
    } else if (durationSeconds === 6) {
      transType = CreditsTransType.VideoGeneration6s;
    } else if (durationSeconds === 8) {
      transType = CreditsTransType.VideoGeneration8s;
    } else if (durationSeconds === 10) {
      transType = CreditsTransType.VideoGeneration10s;
    } else if (durationSeconds === 15) {
      transType = CreditsTransType.VideoGeneration15s;
    } else if (durationSeconds === 25) {
      transType = CreditsTransType.VideoGeneration25s;
    } else {
      return NextResponse.json(
        { error: `不支持的时长: ${durationSeconds}秒` },
        { status: 400 }
      );
    }

    let deductResult;
    try {
      deductResult = await decreaseCredits({
        user_uuid: userId,
        trans_type: transType,
        credits: requiredCredits,
      });
      console.log(
        `💰 Credits deducted: ${deductResult.totalDeducted} from ${deductResult.pools.length} pool(s) for user ${userId}`
      );
    } catch (error) {
      console.error('扣除积分失败:', error);
      return NextResponse.json(
        { error: 'Failed to deduct credits, please try again later' },
        { status: 500 }
      );
    }

    const refundCredits = async () => {
      if (!deductResult?.pools?.length) {
        return;
      }
      for (const pool of deductResult.pools) {
        await increaseCredits({
          user_uuid: userId,
          trans_type: CreditsTransType.RefundVideoGenerationFailed,
          credits: pool.deducted,
          order_no: pool.order_no,
          expired_at: pool.expired_at,
        });
      }
    };

    // 获取对应的 Provider
    const provider = ProviderFactory.getProvider(modelId);

    // 构建 webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/video-generation/webhook`;

    let submitResult;
    try {
      // 提交视频生成任务（Agent 直接走 BytePlus，不走 Volcano 降级）
      submitResult = await provider.submit(
        modelId,
        {
          model: providerModelId,
          prompt: prompt,
          image_url: imageUrl,
          duration: String(durationSeconds),
          aspect_ratio: resolvedAspectRatio,
        },
        webhookUrl // 使用 webhook 自动更新状态
      );
    } catch (error) {
      console.error('内部视频生成提交失败:', error);
      try {
        await refundCredits();
        console.log(`💰 Credits refunded after submission failure for user ${userId}`);
      } catch (refundError) {
        console.error('返还积分失败:', refundError);
      }
      throw error;
    }

    if (!submitResult.request_id) {
      try {
        await refundCredits();
        console.log(`💰 Credits refunded after missing request_id for user ${userId}`);
      } catch (refundError) {
        console.error('返还积分失败:', refundError);
      }
      throw new Error('Failed to submit video generation - no request_id received');
    }

    // 根据模型类型确定 request_id 字段名
    // Kie.ai Veo3 模型使用 veo3_request_id (与 APICore 共享字段)
    // Kie.ai Sora 模型使用 sora_request_id
    let requestIdField = "veo3_request_id";
    if (isSora2Model(modelId)) {
      requestIdField = "sora_request_id";
    } else if (modelConfig?.provider === VideoModelProvider.FAL) {
      requestIdField = "fal_request_id";
    } else if (modelConfig?.provider === VideoModelProvider.ALI) {
      requestIdField = "ali_request_id";
    } else if (
      modelConfig?.provider === VideoModelProvider.BYTEPLUS ||
      modelConfig?.provider === VideoModelProvider.VOLCANO
    ) {
      requestIdField = "volcano_request_id";
    }

    // 创建视频生成记录
    let videoGeneration;
    try {
      videoGeneration = await createVideoGeneration({
        model_id: modelId,
        prompt: prompt,
        input_image_url: imageUrl,
        duration_seconds: durationSeconds,
        user_id: userId,
        status: 'IN_PROGRESS',
        aspect_ratio: resolvedAspectRatio,
        metadata: {
          credit_deduction: {
            pools: deductResult.pools,
            total_deducted: deductResult.totalDeducted,
            deducted_at: new Date().toISOString(),
          },
        },
        [requestIdField]: submitResult.request_id, // 动态设置 request_id 字段
      });
    } catch (error) {
      console.error('创建视频生成记录失败:', error);
      try {
        await refundCredits();
        console.log(`💰 Credits refunded after record creation failure for user ${userId}`);
      } catch (refundError) {
        console.error('返还积分失败:', refundError);
      }
      throw error;
    }

    if (!videoGeneration) {
      throw new Error('Failed to create video generation record');
    }

    // 返回任务信息
    return NextResponse.json({
      success: true,
      videoGenerationId: videoGeneration.id,
      providerRequestId: submitResult.request_id,
      status: 'IN_PROGRESS',
      message: 'Video generation submitted successfully'
    });

  } catch (error: any) {
    console.error('Internal video generation error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}

/**
 * 查询视频生成状态
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const expectedKey = `Bearer ${process.env.INTERNAL_API_KEY}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const videoGenerationId = searchParams.get('id');

  if (!videoGenerationId) {
    return NextResponse.json(
      { error: 'Missing query parameter: id' },
      { status: 400 }
    );
  }

  try {
    const { getVideoGenerationById } = await import('@/models/videoGeneration');
    const videoGeneration = await getVideoGenerationById(videoGenerationId);

    if (!videoGeneration) {
      return NextResponse.json(
        { error: 'Video generation not found' },
        { status: 404 }
      );
    }

    const videoUrl =
      videoGeneration.video_url_r2 ||
      videoGeneration.video_url_veo3 ||
      videoGeneration.video_url_sora ||
      videoGeneration.video_url_volcano ||
      videoGeneration.video_url_fal ||
      videoGeneration.video_url_ali ||
      videoGeneration.video_url_pixverse;

    return NextResponse.json({
      success: true,
      id: videoGeneration.id,
      status: videoGeneration.status,
      videoUrl,
      errorMessage: videoGeneration.error_message
    });

  } catch (error: any) {
    console.error('Query video generation error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to query video generation' },
      { status: 500 }
    );
  }
}
