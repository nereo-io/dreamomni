import type {
  GenerateMusicParams,
  AddVocalsParams,
  AddInstrumentalParams,
  UploadCoverParams,
} from '@/services/musicParamsBuilder';
import type { MusicGenerationType } from '@/types/music.d';

interface ProviderSubmitResponse {
  taskId: string;
}

/**
 * Kie.ai Music Provider（Suno API）
 */
export class KieAiMusicProvider {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiKey: string, timeout: number = 30000) {
    this.apiKey = apiKey;
    this.baseUrl = process.env.KIE_AI_BASE_URL || 'https://api.kie.ai';
    this.timeout = timeout;
  }

  /**
   * 提交音乐生成任务（统一入口）
   */
  async submit(
    generationType: MusicGenerationType,
    params: GenerateMusicParams | AddVocalsParams | AddInstrumentalParams | UploadCoverParams
  ): Promise<ProviderSubmitResponse> {
    switch (generationType) {
      case 'direct':
        return this.generateMusic(params as GenerateMusicParams);
      
      case 'add-vocals':
        return this.addVocals(params as AddVocalsParams);
      
      case 'add-instrumental':
        return this.addInstrumental(params as AddInstrumentalParams);
      
      case 'upload-cover':
        return this.uploadCover(params as UploadCoverParams);
      
      default:
        throw new Error(`Unsupported generation type: ${generationType}`);
    }
  }

  /**
   * 查询任务状态（record-info）
   */
  async getRecordInfo(taskId: string): Promise<any> {
    const endpoint = `/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;
    return this.makeRequest(endpoint, 'GET');
  }

  /**
   * Generate Music（直接生成）
   * API: POST /api/v1/generate
   */
  private async generateMusic(params: GenerateMusicParams): Promise<ProviderSubmitResponse> {
    const endpoint = '/api/v1/generate';
    const response = await this.makeRequest(endpoint, 'POST', params);
    
    if (response.code !== 200) {
      throw new Error(response.msg || 'Failed to generate music');
    }
    
    if (!response.data?.taskId) {
      throw new Error('No taskId in response');
    }
    
    return {
      taskId: response.data.taskId,
    };
  }

  /**
   * Add Vocals（添加人声）
   * API: POST /api/v1/generate/add-vocals
   */
  private async addVocals(params: AddVocalsParams): Promise<ProviderSubmitResponse> {
    const endpoint = '/api/v1/generate/add-vocals';
    const response = await this.makeRequest(endpoint, 'POST', params);
    
    if (response.code !== 200) {
      throw new Error(response.msg || 'Failed to add vocals');
    }
    
    if (!response.data?.taskId) {
      throw new Error('No taskId in response');
    }
    
    return {
      taskId: response.data.taskId,
    };
  }

  /**
   * Add Instrumental（添加伴奏）
   * API: POST /api/v1/generate/add-instrumental
   */
  private async addInstrumental(params: AddInstrumentalParams): Promise<ProviderSubmitResponse> {
    const endpoint = '/api/v1/generate/add-instrumental';
    const response = await this.makeRequest(endpoint, 'POST', params);
    
    if (response.code !== 200) {
      throw new Error(response.msg || 'Failed to add instrumental');
    }
    
    if (!response.data?.taskId) {
      throw new Error('No taskId in response');
    }
    
    return {
      taskId: response.data.taskId,
    };
  }

  /**
   * Upload Cover（上传翻唱）
   * API: POST /api/v1/generate/upload-cover
   */
  private async uploadCover(params: UploadCoverParams): Promise<ProviderSubmitResponse> {
    const endpoint = '/api/v1/generate/upload-cover';
    const response = await this.makeRequest(endpoint, 'POST', params);
    
    if (response.code !== 200) {
      throw new Error(response.msg || 'Failed to upload cover');
    }
    
    if (!response.data?.taskId) {
      throw new Error('No taskId in response');
    }
    
    return {
      taskId: response.data.taskId,
    };
  }

  /**
   * 发送 HTTP 请求（通用方法）
   */
  private async makeRequest(
    endpoint: string,
    method: 'POST' | 'GET' = 'POST',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          this.mapErrorMessage(response.status, errorText)
        );
      }
      
      const data = await response.json();
      return data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * 错误消息映射
   */
  private mapErrorMessage(status: number, errorData: string): string {
    const errorMap: Record<number, string> = {
      400: 'Invalid request parameters',
      401: 'Invalid API key',
      403: 'API key has no permission',
      404: 'Endpoint not found',
      429: 'Rate limit exceeded',
      500: 'Provider internal error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };
    
    const defaultMessage = errorMap[status] || `HTTP error: ${status}`;
    
    try {
      const parsed = JSON.parse(errorData);
      return parsed.msg || parsed.message || defaultMessage;
    } catch {
      return defaultMessage;
    }
  }
}
