import type { MusicGeneration } from '@/types/music.d';

/**
 * 音频文件信息接口
 */
export interface ParsedAudioFile {
  audio_url: string | null;
  audio_url_r2: string | null;
  audio_url_provider: string | null;
  image_url: string | null;
  stream_audio_url: string | null;
  duration_seconds: number | null;
  prompt: string | null;
  tags: string | null;
}

/**
 * 解析音频数据，从 JSON 字符串数组和 metadata 中提取多个音频文件信息
 * 
 * @param music 音乐生成记录
 * @returns 音频文件数组，如果音频未生成完成或无音频地址则返回 undefined
 */
export function parseAudioData(music: MusicGeneration): ParsedAudioFile[] | undefined {
  // 检查状态：只有在这些状态下才返回音频数据
  const validStatuses = ['COMPLETED', 'FIRST_TRACK_COMPLETED', 'SAVED_TO_R2'];
  if (!validStatuses.includes(music.status)) {
    return undefined;
  }
  
  // 检查是否有音频地址
  const hasAudioUrl = music.audio_url_provider || music.audio_url_r2;
  if (!hasAudioUrl) {
    return undefined;
  }

  try {
    // 安全解析 JSON 字符串或普通字符串
    const safeJsonParse = (value: string | null | undefined): any[] => {
      if (!value) return [];
      // 检查是否是 JSON 数组格式
      const trimmed = value.trim();
      if (trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          console.error('JSON parse error for:', trimmed.substring(0, 50), e);
          return [];
        }
      }
      // 如果是普通字符串（URL），返回包含该字符串的数组
      return [value];
    };

    // 解析 URL 数组或单个 URL
    const audioUrlsProvider = safeJsonParse(music.audio_url_provider);
    const audioUrlsR2 = safeJsonParse(music.audio_url_r2);
    const imageUrls = safeJsonParse(music.image_url);
    const streamAudioUrls = safeJsonParse(music.stream_audio_url);
    
    // 从 metadata 中获取 complete 回调数据
    const metadataKey = `${music.provider}Complete`;
    const completeData = music.metadata?.[metadataKey] || [];
    
    // 如果不是数组格式（兼容老数据），返回单个音频对象
    if (!Array.isArray(audioUrlsProvider) || audioUrlsProvider.length === 0) {
      return [{
        audio_url: music.audio_url_r2 || music.audio_url_provider || null,
        audio_url_r2: music.audio_url_r2 || null,
        audio_url_provider: music.audio_url_provider || null,
        image_url: music.image_url || null,
        stream_audio_url: music.stream_audio_url || null,
        duration_seconds: music.duration_seconds || null,
        prompt: music.prompt || null,
        tags: music.generated_tags || null,
      }];
    }
    
    // 组合多个音频文件的信息
    const audioFiles = audioUrlsProvider.map((providerUrl: string, index: number) => {
      const completeItem = completeData[index] || {};
      const r2Url = Array.isArray(audioUrlsR2) ? audioUrlsR2[index] : null;
      
      return {
        audio_url: r2Url || providerUrl || null,
        audio_url_r2: r2Url || null,
        audio_url_provider: providerUrl || null,
        image_url: Array.isArray(imageUrls) ? imageUrls[index] : null,
        stream_audio_url: Array.isArray(streamAudioUrls) ? streamAudioUrls[index] : null,
        duration_seconds: completeItem.duration || music.duration_seconds || null,
        prompt: completeItem.prompt || music.prompt || null,
        tags: completeItem.tags || music.generated_tags || null,
      };
    });
    
    return audioFiles;
  } catch (error) {
    console.error('Failed to parse audio data:', error);
    // 兼容老数据或解析失败的情况
    return [{
      audio_url: music.audio_url_r2 || music.audio_url_provider || null,
      audio_url_r2: music.audio_url_r2 || null,
      audio_url_provider: music.audio_url_provider || null,
      image_url: music.image_url || null,
      stream_audio_url: music.stream_audio_url || null,
      duration_seconds: music.duration_seconds || null,
      prompt: music.prompt || null,
      tags: music.generated_tags || null,
    }];
  }
}

