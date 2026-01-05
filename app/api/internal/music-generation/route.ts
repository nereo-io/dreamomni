import { NextRequest, NextResponse } from 'next/server';
import type { SubmitMusicGenerationRequest } from '@/types/music.d';
import { MusicParamsValidator, MusicParamsValidationError } from '@/services/musicParamsValidator';
import { MusicParamsBuilder } from '@/services/musicParamsBuilder';
import { KieAiMusicProvider } from '@/services/providers/KieAiMusicProvider';
import { createMusicGeneration, getMusicGenerationById, updateMusicGeneration } from '@/models/musicGeneration';
import { getMusicModel, getMusicModelCredits, getMusicModelEstimatedTime } from '@/config/music-models';
import { parseAudioData } from '@/lib/music-utils';

type InternalMusicGenerationSubmitBody = SubmitMusicGenerationRequest & {
  userId: string;
  metadata?: Record<string, any>;
  skipCredits?: boolean;
};

function assertInternalAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const expectedKey = `Bearer ${process.env.INTERNAL_API_KEY}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

/**
 * POST /api/internal/music-generation
 * 用途：python-agent 内部调用提交 Suno(text-to-music) 任务
 * 说明：agent 场景必须传 skipCredits=true（扣费由 python-agent 统一负责）
 */
export async function POST(req: NextRequest) {
  const unauthorized = assertInternalAuth(req);
  if (unauthorized) return unauthorized;

  try {
    const body = (await req.json()) as Partial<InternalMusicGenerationSubmitBody>;

    const userId = body.userId;
    const prompt = body.prompt;
    const skipCredits = Boolean(body.skipCredits);

    if (!userId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, prompt' },
        { status: 400 }
      );
    }

    if (!skipCredits) {
      return NextResponse.json(
        { error: 'Internal music-generation requires skipCredits=true' },
        { status: 400 }
      );
    }

    const modelId = body.modelId || 'suno-v5';
    const modelConfig = getMusicModel(modelId);
    if (!modelConfig) {
      return NextResponse.json({ error: `Invalid model ID: ${modelId}` }, { status: 400 });
    }

    const params: SubmitMusicGenerationRequest = {
      generationType: body.generationType || 'direct',
      customMode: body.customMode ?? true,
      instrumental: body.instrumental ?? true,
      prompt,
      title: body.title,
      style: body.style,
      negativeTags: body.negativeTags,
      modelId,
      vocalGender: body.vocalGender,
      uploadAudioUrl: body.uploadAudioUrl,
      styleWeight: body.styleWeight,
      weirdnessConstraint: body.weirdnessConstraint,
      audioWeight: body.audioWeight,
      personaId: body.personaId,
    };

    MusicParamsValidator.validate(params);

    const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/music-generation/webhook`;
    const providerParams = MusicParamsBuilder.buildProviderParams(params, webhookUrl);

    const record = await createMusicGeneration({
      user_id: userId,
      provider: modelConfig.provider,
      model_id: modelId,
      generation_type: params.generationType || 'direct',
      custom_mode: params.customMode ?? true,
      instrumental: params.instrumental ?? true,
      prompt: params.prompt || '',
      title: params.title,
      style: params.style,
      negative_tags: params.negativeTags,
      upload_audio_url: params.uploadAudioUrl,
      vocal_gender: params.vocalGender,
      style_weight: params.styleWeight,
      weirdness_constraint: params.weirdnessConstraint,
      audio_weight: params.audioWeight,
      persona_id: params.personaId,
      status: 'PENDING',
      credits_cost: 0,
      metadata: {
        ...(body.metadata || {}),
        source: 'agent',
      },
    });

    if (!process.env.KIE_AI_API_KEY) {
      await updateMusicGeneration(record.id, {
        status: 'FAILED',
        error_message: 'KIE_AI_API_KEY not configured',
      });
      return NextResponse.json(
        { error: 'KIE_AI_API_KEY not configured' },
        { status: 500 }
      );
    }

    let providerTaskId: string;
    try {
      const provider = new KieAiMusicProvider(process.env.KIE_AI_API_KEY);
      const providerResult = await provider.submit(
        params.generationType || 'direct',
        providerParams as any
      );
      providerTaskId = providerResult.taskId;
    } catch (submitError: any) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : 'Provider submission failed';
      await updateMusicGeneration(record.id, {
        status: 'FAILED',
        error_message: errorMessage,
        metadata: {
          ...record.metadata,
          error: {
            message: errorMessage,
            timestamp: new Date().toISOString(),
            stage: 'provider_submission',
          },
        },
      });
      throw submitError;
    }

    const updated = await updateMusicGeneration(record.id, { provider_task_id: providerTaskId });

    return NextResponse.json({
      success: true,
      musicGenerationId: updated.id,
      providerTaskId: updated.provider_task_id,
      status: updated.status,
      estimatedTime: getMusicModelEstimatedTime(modelId),
      creditsCost: getMusicModelCredits(modelId),
    });
  } catch (error: any) {
    console.error('[Internal Music Gen] submit error:', error);

    if (error instanceof MusicParamsValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit music generation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/internal/music-generation?id=...
 * 用途：python-agent 内部轮询音乐生成状态
 */
export async function GET(req: NextRequest) {
  const unauthorized = assertInternalAuth(req);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing query parameter: id' }, { status: 400 });
  }

  try {
    let record = await getMusicGenerationById(id);
    if (!record) {
      return NextResponse.json({ error: 'Music generation not found' }, { status: 404 });
    }

    const shouldTrySyncFromProvider =
      record.provider === 'kieai' &&
      Boolean(record.provider_task_id) &&
      Boolean(process.env.KIE_AI_API_KEY) &&
      ['PENDING', 'TEXT_GENERATED', 'FIRST_TRACK_COMPLETED'].includes(record.status);

    if (shouldTrySyncFromProvider) {
      try {
        const provider = new KieAiMusicProvider(process.env.KIE_AI_API_KEY!);
        const recordInfo = await provider.getRecordInfo(record.provider_task_id!);
        const infoData = recordInfo?.data;

        const providerStatus = String(infoData?.status || '').toUpperCase();
        const isProviderOk = recordInfo?.code === 200;

        if (isProviderOk && providerStatus === 'SUCCESS') {
          const sunoData = infoData?.response?.sunoData;
          if (Array.isArray(sunoData) && sunoData.length > 0) {
            const completeItems = sunoData.map((item: any) => ({
              id: item.id,
              audio_url: item.audioUrl,
              stream_audio_url: item.streamAudioUrl,
              image_url: item.imageUrl,
              prompt: item.prompt,
              model_name: item.modelName,
              title: item.title,
              tags: item.tags,
              createTime: item.createTime,
              duration: item.duration,
              source_audio_url: item.sourceAudioUrl,
              source_stream_audio_url: item.sourceStreamAudioUrl,
              source_image_url: item.sourceImageUrl,
            }));

            const audioUrls = completeItems
              .map((item: any) => item.audio_url)
              .filter(Boolean);
            const imageUrls = completeItems
              .map((item: any) => item.image_url)
              .filter(Boolean);
            const streamAudioUrls = completeItems
              .map((item: any) => item.stream_audio_url)
              .filter(Boolean);
            const tags = completeItems.map((item: any) => item.tags).filter(Boolean);
            const durations = completeItems
              .map((item: any) => item.duration)
              .filter((d: any) => typeof d === 'number');

            record = await updateMusicGeneration(record.id, {
              status: 'COMPLETED',
              audio_url_provider: JSON.stringify(audioUrls),
              image_url: JSON.stringify(imageUrls),
              stream_audio_url: JSON.stringify(streamAudioUrls),
              generated_tags: JSON.stringify(tags),
              duration_seconds: durations.length > 0 ? durations[0] : undefined,
              metadata: {
                ...record.metadata,
                [`${record.provider}Complete`]: completeItems,
                [`${record.provider}RecordInfo`]: infoData,
              },
              completed_at: new Date(),
            });
          }
        } else if (
          isProviderOk &&
          (providerStatus === 'FAIL' ||
            providerStatus === 'FAILED' ||
            Boolean(infoData?.errorCode) ||
            Boolean(infoData?.errorMessage))
        ) {
          const errorMessage = String(
            infoData?.errorMessage || recordInfo?.msg || 'Provider generation failed'
          );
          const errorCode = infoData?.errorCode ? String(infoData.errorCode) : undefined;

          record = await updateMusicGeneration(record.id, {
            status: 'FAILED',
            error_message: errorMessage,
            ...(errorCode && { error_code: errorCode }),
            metadata: {
              ...record.metadata,
              [`${record.provider}RecordInfo`]: infoData,
              error: {
                message: errorMessage,
                code: errorCode || 'UNKNOWN',
                timestamp: new Date().toISOString(),
                stage: 'provider_record_info',
              },
            },
          });
        }
      } catch (syncError: any) {
        console.warn('[Internal Music Gen] record-info sync skipped:', syncError?.message || syncError);
      }
    }

    const audioFiles = parseAudioData(record);

    return NextResponse.json({
      success: true,
      id: record.id,
      status: record.status,
      audioFiles:
        audioFiles?.map((file) => ({
          audio_url: file.audio_url,
          duration_seconds: file.duration_seconds,
        })) || [],
      errorMessage: record.error_message,
    });
  } catch (error: any) {
    console.error('[Internal Music Gen] query error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query music generation' },
      { status: 500 }
    );
  }
}
