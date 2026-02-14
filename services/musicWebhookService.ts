import type {
  KieAiMusicWebhookPayload,
  MusicWebhookCallbackType,
  MusicGeneration,
} from '@/types/music.d';
import {
  getMusicGenerationByProviderTaskId,
  updateMusicGenerationByProviderTaskId,
} from '@/models/musicGeneration';
import { increaseCredits, CreditsTransType } from '@/services/credit';
import { newStorage } from '@/lib/storage';

/**
 * 音乐生成 Webhook 处理服务
 */
export class MusicWebhookService {
  
  /**
   * 处理 Webhook 回调（主入口）
   */
  static async handleCallback(payload: KieAiMusicWebhookPayload): Promise<void> {
    const { callbackType, task_id, data } = payload.data;
    
    if (!task_id) {
      throw new Error('Missing task_id in webhook payload');
    }
    
    const record = await getMusicGenerationByProviderTaskId(task_id);
    
    if (!record) {
      console.warn(`Music generation record not found for task_id: ${task_id}`);
      return;
    }
    
    // 检查记录状态，如果已经是终态，则不再处理
    if (record.status === 'COMPLETED' || record.status === 'FAILED') {
      console.warn(
        `⚠️ Webhook ignored: Music generation already in terminal state (${record.status}) for task_id: ${task_id}, callback type: ${callbackType}`
      );
      return;
    }
    
    // data 是一个数组，包含多个音频项
    switch (callbackType) {
      case 'text':
        await this.handleTextGenerated(record, data);
        break;
      
      case 'first':
        await this.handleFirstTrackCompleted(record, data);
        break;
      
      case 'complete':
        // 传递完整的 payload 以便保存完整回调结果
        await this.handleAllCompleted(record, data);
        break;
      
      case 'error':
        await this.handleError(record, payload);
        break;
      
      default:
        console.warn(`Unknown callback type: ${callbackType}`);
    }
  }
  
  /**
   * 处理文本生成完成（歌词生成）
   * 只更新状态和 metadata，不更新其他字段
   */
  private static async handleTextGenerated(
    record: MusicGeneration,
    data: any[]
  ): Promise<void> {
    console.log(`📝 Text generated for task: ${record.provider_task_id}, items: ${data?.length || 0}`);
    
    const metadataKey = `${record.provider}Text`;
    
    await updateMusicGenerationByProviderTaskId(record.provider_task_id!, {
      status: 'TEXT_GENERATED',
      metadata: {
        ...record.metadata,
        [metadataKey]: data || [],
      },
      updated_at: new Date(),
    });
  }
  
  /**
   * 处理第一首音频完成
   * 只更新状态和 metadata，不更新其他字段
   */
  private static async handleFirstTrackCompleted(
    record: MusicGeneration,
    dataArray: any[]
  ): Promise<void> {
    console.log(`🎵 First track completed for task: ${record.provider_task_id}, items: ${dataArray?.length || 0}`);
    
    const metadataKey = `${record.provider}First`;
    
    await updateMusicGenerationByProviderTaskId(record.provider_task_id!, {
      status: 'FIRST_TRACK_COMPLETED',
      metadata: {
        ...record.metadata,
        [metadataKey]: dataArray || [],
      },
      updated_at: new Date(),
    });
  }
  
  /**
   * 处理所有曲目完成
   * 更新所有字段，将多个 track 的资源保存为数组
   */
  private static async handleAllCompleted(
    record: MusicGeneration,
    dataArray: any[]
  ): Promise<void> {
    console.log(`✅ All tracks completed for task: ${record.provider_task_id}, items: ${dataArray?.length || 0}`);
    
    if (!dataArray || dataArray.length === 0) {
      console.warn(`No data items in complete callback for task: ${record.provider_task_id}`);
      return;
    }
    
    const metadataKey = `${record.provider}Complete`;
    
    // 提取所有音频URL（按顺序）
    const audioUrls: string[] = [];
    const imageUrls: string[] = [];
    const streamAudioUrls: string[] = [];
    const allTags: string[] = [];
    const allDurations: number[] = [];
    
    for (const item of dataArray) {
      if (item.audio_url) audioUrls.push(item.audio_url);
      if (item.image_url) imageUrls.push(item.image_url);
      if (item.stream_audio_url) streamAudioUrls.push(item.stream_audio_url);
      if (item.tags) allTags.push(item.tags);
      if (item.duration) allDurations.push(item.duration);
    }
    
    // 遍历上传所有音频到 R2
    const r2Urls: string[] = [];
    console.log(`⬇️ Uploading ${audioUrls.length} audio files to R2...`);
    
    for (let i = 0; i < audioUrls.length; i++) {
      const audioUrl = audioUrls[i];
      try {
        const r2Url = await this.downloadAndSaveAudio(
          audioUrl,
          record.user_id,
          record.provider_task_id!,
          i // 索引用于区分多个音频
        );
        r2Urls.push(r2Url);
        console.log(`✅ Uploaded audio ${i + 1}/${audioUrls.length} to R2`);
      } catch (error) {
        console.error(`Failed to download audio ${i} to R2:`, error);
        r2Urls.push(''); // 占位，保持数组顺序
      }
    }
    
    // 将数组转换为 JSON 字符串存储到数据库
    // 数据库字段是 TEXT 类型，所以存储 JSON 字符串
    await updateMusicGenerationByProviderTaskId(record.provider_task_id!, {
      status: 'COMPLETED',
      audio_url_provider: JSON.stringify(audioUrls),
      audio_url_r2: JSON.stringify(r2Urls.filter(url => url)), // 只保存成功上传的
      image_url: JSON.stringify(imageUrls),
      stream_audio_url: JSON.stringify(streamAudioUrls),
      generated_tags: JSON.stringify(allTags), // 合并所有标签
      duration_seconds: allDurations.length > 0 ? allDurations[0] : undefined, // 使用第一个音频的时长
      metadata: {
        ...record.metadata,
        [metadataKey]: dataArray, // 供应商返回的完整数据
      },
      updated_at: new Date(),
      completed_at: new Date(),
    });
  }
  
  /**
   * 处理错误回调
   */
  private static async handleError(
    record: MusicGeneration,
    payload: KieAiMusicWebhookPayload
  ): Promise<void> {
    console.error(`❌ Error in music generation for task: ${record.provider_task_id}`);
    
    const errorMessage = payload.msg || 'Unknown error';
    const errorCode = payload.code?.toString() || 'UNKNOWN';
    
    const metadataKey = `${record.provider}Error`;
    
    // 准备新的metadata
    const newMetadata: Record<string, any> = {
      ...record.metadata,
      [metadataKey]: payload.data,
      error: {
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        stage: 'provider_generation'
      },
    };
    
    // 处理退款
    if (record.credits_cost > 0) {
      try {
        // 从 metadata 获取扣费池信息
        const creditDeduction = record.metadata?.credit_deduction;

        if (creditDeduction?.pools && creditDeduction.pools.length > 0) {
          // 优先使用 metadata 中的扣费池信息（更精确）
          for (const pool of creditDeduction.pools) {
            await increaseCredits({
              user_uuid: record.user_id,
              credits: pool.deducted,
              trans_type: CreditsTransType.RefundMusicGenerationFailed,
              order_no: pool.order_no,
              expired_at: pool.expired_at,
            });
          }

          console.log(
            `💰 Refunded ${creditDeduction.total_deducted} credits across ${creditDeduction.pools.length} pool(s) for failed task: ${record.provider_task_id}`
          );
          
          // 添加退款信息到metadata
          newMetadata.credit_refund = {
            refunded: true,
            refunded_at: new Date().toISOString(),
            refund_amount: creditDeduction.total_deducted,
            pools: creditDeduction.pools,
          };
        } else {
          console.warn(
            `⚠️ No credit deduction pools found in metadata for task ${record.provider_task_id}`
          );
        }
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    // 一次性更新状态、错误信息和退款记录
    await updateMusicGenerationByProviderTaskId(record.provider_task_id!, {
      status: 'FAILED',
      error_message: errorMessage,
      error_code: errorCode,
      metadata: newMetadata,
      updated_at: new Date(),
    });
  }
  
  /**
   * 下载音频并保存到 R2
   * @param index 音频索引（用于区分多个音频文件）
   */
  private static async downloadAndSaveAudio(
    audioUrl: string,
    userId: string,
    taskId: string,
    index: number = 0
  ): Promise<string> {
    console.log(`⬇️ Downloading audio to R2: ${audioUrl}`);
    
    const storage = newStorage();
    
    // 如果有多个音频，添加索引后缀
    const suffix = index > 0 ? `_${index}` : '';
    const key = `music/${userId}/${taskId}${suffix}.mp3`;
    
    const result = await storage.downloadAndUpload({
      url: audioUrl,
      key,
      contentType: 'audio/mpeg',
      disposition: 'inline',
      cacheControl: 'public, max-age=31536000',
    });
    
    if (!result.url) {
      throw new Error('Failed to get R2 URL after upload');
    }
    
    console.log(`✅ Audio saved to R2: ${result.url}`);
    
    return result.url;
  }
}
