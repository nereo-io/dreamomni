import type {
  SubmitMusicGenerationRequest,
  MusicGeneration,
} from '@/types/music.d';
import type { DeductResult } from '@/services/credit';
import { MusicParamsValidator, MusicParamsValidationError } from './musicParamsValidator';
import { MusicParamsBuilder } from './musicParamsBuilder';
import { KieAiMusicProvider } from './providers/KieAiMusicProvider';
import { createMusicGeneration, updateMusicGeneration } from '@/models/musicGeneration';
import { decreaseCredits, increaseCredits, CreditsTransType } from '@/services/credit';
import { getMusicModel, getMusicModelCredits } from '@/config/music-models';

/**
 * 音乐生成服务
 */
export class MusicGenerationService {
  
  /**
   * 提交音乐生成任务（主入口）
   */
  static async submitGeneration(
    params: SubmitMusicGenerationRequest,
    userId: string,
    webhookUrl: string
  ): Promise<{ record: MusicGeneration; deductResult: DeductResult }> {
    
    MusicParamsValidator.validate(params);
    
    const modelId = params.modelId || 'suno-v5';
    const modelConfig = getMusicModel(modelId);
    if (!modelConfig) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    
    const credits = getMusicModelCredits(modelId);
    
    const deductResult = await decreaseCredits({
      user_uuid: userId,
      credits,
      trans_type: CreditsTransType.MusicGeneration,
    });
    
    let record: MusicGeneration | null = null;
    
    try {
      const {
        generationType = 'direct',
        customMode = true,
        instrumental = false,
      } = params;
      
      record = await createMusicGeneration({
        user_id: userId,
        provider: modelConfig.provider,
        model_id: modelId,
        generation_type: generationType,
        custom_mode: customMode,
        instrumental,
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
        credits_cost: credits,
        metadata: {
          credit_deduction: {
            pools: deductResult.pools,
            total_deducted: deductResult.totalDeducted,
            deducted_at: new Date().toISOString(),
          },
          api_endpoint: this.getApiEndpoint(generationType),
        },
      });
      
      const providerParams = MusicParamsBuilder.buildProviderParams(params, webhookUrl);
      
      const provider = new KieAiMusicProvider(process.env.KIE_AI_API_KEY!);
      const providerResult = await provider.submit(generationType, providerParams);
      
      await updateMusicGeneration(record.id, {
        provider_task_id: providerResult.taskId,
        updated_at: new Date(),
      });
      
      return {
        record: {
          ...record,
          provider_task_id: providerResult.taskId,
        },
        deductResult,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 🔴 关键：先执行退款，确保用户credits优先退回
      console.log(`🔄 Starting refund process for user ${userId}, amount: ${credits}`);
      await this.refundCredits(userId, credits, deductResult);
      console.log(`✅ Refund completed successfully`);
      
      // 然后再更新数据库记录
      if (record) {
        try {
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
              credit_refund: {
                refunded: true,
                refunded_at: new Date().toISOString(),
                refund_amount: credits,
                pools: deductResult.pools,
              },
            },
            updated_at: new Date(),
          });
          
          console.error(`❌ Music generation ${record.id} failed and refunded:`, errorMessage);
        } catch (updateError) {
          console.error(`⚠️ Failed to update record ${record.id} status:`, updateError);
          // 即使更新失败也继续退款流程
          try {
            await updateMusicGeneration(record.id, {
              status: 'FAILED',
              error_message: `Refund completed but DB update failed: ${errorMessage}`,
            });
          } catch (retryError) {
            console.error(`❌ CRITICAL: Unable to update record ${record.id} status at all:`, retryError);
            // 这里应该发送告警通知，需要人工介入检查
          }
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 退款（失败时）
   */
  static async refundCredits(
    userId: string,
    credits: number,
    deductResult: DeductResult
  ): Promise<void> {
    try {
      // 遍历所有扣费的池，按原扣费金额逐一退款
      for (const pool of deductResult.pools) {
        await increaseCredits({
          user_uuid: userId,
          credits: pool.deducted,
          trans_type: CreditsTransType.RefundMusicGenerationFailed,
          order_no: pool.order_no,
          expired_at: pool.expired_at,
        });

        console.log(
          `💰 Credits refunded: ${pool.deducted} to pool ${pool.order_no}`
        );
      }

      console.log(
        `💰 Total refunded: ${deductResult.totalDeducted} credits across ${deductResult.pools.length} pool(s)`
      );
    } catch (refundError) {
      // 🔴 退款失败是严重错误，必须抛出让上层感知
      console.error('❌ CRITICAL: Failed to refund credits:', refundError);
      console.error(
        `❌ AUDIT LOG: Refund failed - user=${userId}, credits=${credits}, pools=${JSON.stringify(deductResult.pools)}`
      );
      throw new Error(`Refund failed: ${refundError instanceof Error ? refundError.message : 'Unknown error'}`);
    }
  }
  
  /**
   * 获取 API 端点（用于 metadata 记录）
   */
  private static getApiEndpoint(generationType: string): string {
    const endpoints: Record<string, string> = {
      'direct': '/api/v1/generate',
      'add-vocals': '/api/v1/generate/add-vocals',
      'add-instrumental': '/api/v1/generate/add-instrumental',
      'upload-cover': '/api/v1/generate/upload-cover',
    };
    return endpoints[generationType] || '/api/v1/generate';
  }
}
