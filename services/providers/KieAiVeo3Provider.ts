import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

export class KieAiVeo3Provider implements VideoProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Kie.ai API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = `${process.env.KIE_AI_BASE_URL || 'https://api.kie.ai'}/api/v1/veo`;
  }

  getName(): string {
    return "kie-ai-veo3";
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      // Map error codes based on fal.ai documentation
      let errorMessage: string;
      switch (response.status) {
        case 401:
          errorMessage =
            "Unauthorized - Authentication credentials missing or invalid";
          break;
        case 402:
          errorMessage =
            "Insufficient Credits - Account does not have enough credits";
          break;
        case 404:
          errorMessage =
            "Not Found - The requested resource or endpoint does not exist";
          break;
        case 422:
          errorMessage =
            "Validation Error - The request parameters failed validation checks";
          break;
        case 429:
          errorMessage =
            "Rate Limited - Request limit has been exceeded for this resource";
          break;
        case 455:
          errorMessage =
            "Service Unavailable - System is currently undergoing maintenance";
          break;
        case 500:
          errorMessage =
            "Server Error - An unexpected error occurred while processing the request";
          break;
        case 501:
          errorMessage = "Generation Failed - Video generation task failed";
          break;
        case 505:
          errorMessage =
            "Feature Disabled - The requested feature is currently disabled";
          break;
        default:
          errorMessage =
            errorData.msg ||
            errorData.error?.message ||
            errorText ||
            `API Error: ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    try {
      const endpoint = "/generate";

      // Build request body according to Kie.ai API format
      const requestBody: any = {
        prompt: input.prompt,
        model: "veo3_fast",
        // model: input.model || "veo3_fast", // Use input.model if available, fallback to veo3
      };

      // Handle generationType (e.g., REFERENCE_2_VIDEO)
      if (input.generationType) {
        requestBody.generationType = input.generationType;
      }

      // Add image URLs if provided (支持1-2张图片，REFERENCE_2_VIDEO支持1-3张)
      // 优先使用 image_urls 数组，向后兼容 image_url
      if (input.image_urls && input.image_urls.length > 0) {
        // 直接传递图片数组，API 会自动判断模式：
        // - 1张图片：单图生成视频
        // - 2张图片：首尾帧生成视频
        // - 1-3张图片 (REFERENCE_2_VIDEO)：参考图生成一致角色视频
        requestBody.imageUrls = input.image_urls;
      } else if (input.image_url) {
        // 向后兼容单个 image_url
        requestBody.imageUrls = [input.image_url];
      }

      // Add aspect ratio if provided
      if (input.aspect_ratio) {
        // Frontend uses 'Auto' which matches Veo3 API requirement
        requestBody.aspectRatio = input.aspect_ratio;
      }

      // Add seed if provided
      if (input.seed) {
        requestBody.seeds = input.seed;
      }

      // Add watermark if enabled (for non-member users)
      if (input.watermarkEnabled) {
        requestBody.watermark = "veo3ai.io";
      }

      // Add callback URL if provided
      if (webhookUrl) {
        requestBody.callBackUrl = webhookUrl;
      }

      console.log(
        "🎬 Kie.ai Veo3 视频生成请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(endpoint, "POST", requestBody);

      console.log(
        "🎬 Kie.ai Veo3 提交响应:",
        JSON.stringify(response, null, 2)
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Generation request failed");
      }

      if (!response.data?.taskId) {
        throw new Error("No taskId received from Kie.ai API");
      }

      return {
        request_id: response.data.taskId,
        status: "submitted",
        model: model,
        task_id: response.data.taskId,
        raw_response: response,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Veo3 Provider submit failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async status(
    _model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    try {
      const endpoint = `/record-info?taskId=${encodeURIComponent(requestId)}`;
      const response = await this.makeRequest(endpoint, "GET");

      // Handle API response errors
      if (response.code !== 200) {
        if (response.code === 400 && response.msg?.includes("1080P")) {
          return {
            request_id: requestId,
            status: "IN_PROGRESS",
            progress: 90,
            raw_data: response,
          };
        }
        throw new Error(response.msg || "Status check failed");
      }

      const data = response.data;

      // Map response to standard status based on fal.ai documentation structure
      let status: string;
      let progress = 0;
      let error_message: string | undefined;

      if (data.errorCode) {
        status = "FAILED";
        progress = 0;
        // Extract error message from errorMessage field or fallback to code description
        error_message =
          data.errorMessage || response.msg || `Error code: ${data.errorCode}`;
      } else if (
        data.successFlag === 1 &&
        data.completeTime &&
        data.response?.resultUrls?.length > 0
      ) {
        status = "COMPLETED";
        progress = 100;
      } else {
        status = "IN_PROGRESS";
        progress = data.successFlag === 0 ? 25 : 50;
      }

      return {
        request_id: requestId,
        status,
        progress,
        error_message,
        raw_data: data,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Public method to request 1080P video with polling
  // Returns the 1080P video URL or null if failed/timeout
  async request1080P(
    requestId: string,
    maxRetries: number = 10,
    retryInterval: number = 20000 // 20 seconds
  ): Promise<{
    success: boolean;
    video_url?: string;
    message: string;
  }> {
    console.log(`🎬 开始1080P升级轮询: ${requestId}, 最大重试${maxRetries}次`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.get1080P(requestId);

        if (result.hd_available && result.hd_video_url) {
          console.log(`✅ 1080P升级成功 (第${attempt}次尝试): ${result.hd_video_url}`);
          return {
            success: true,
            video_url: result.hd_video_url,
            message: "1080P upgrade successful",
          };
        }

        if (result.hd_processing) {
          console.log(`⏳ 1080P仍在处理中 (第${attempt}/${maxRetries}次)，${retryInterval/1000}秒后重试...`);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
          }
        } else {
          // hd_available = false, hd_processing = false - 1080P不可用
          console.warn(`⚠️ 1080P不可用 (第${attempt}次尝试)`);
          // 继续重试几次，可能是暂时性问题
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
          }
        }
      } catch (error) {
        console.error(`1080P轮询失败 (第${attempt}次):`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
        }
      }
    }

    console.warn(`❌ 1080P升级超时，已达最大重试次数: ${maxRetries}`);
    return {
      success: false,
      message: `1080P upgrade timeout after ${maxRetries} attempts`,
    };
  }

  // Public method to request 4K video upscaling with callback
  async request4K(
    requestId: string,
    callbackUrl: string
  ): Promise<{
    success: boolean;
    message: string;
    taskId?: string; // 4K 升级任务的新 taskId
  }> {
    try {
      const endpoint = "/get-4k-video";

      const requestBody = {
        taskId: requestId,
        index: 0,
        callBackUrl: callbackUrl,
      };

      console.log(
        "🎬 Kie.ai 4K 升级请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(endpoint, "POST", requestBody);

      console.log(
        "🎬 Kie.ai 4K 升级响应:",
        JSON.stringify(response, null, 2)
      );

      // 4K 升级会产生新的 taskId，用于回调查找记录
      const newTaskId = response.data?.taskId;

      if (response.code === 200) {
        return {
          success: true,
          message: "4K upscaling request submitted successfully",
          taskId: newTaskId,
        };
      } else if (response.code === 422) {
        // 可能已经在处理中或已完成
        return {
          success: true,
          message: response.msg || "4K upscaling already in progress or completed",
          taskId: newTaskId,
        };
      } else {
        return {
          success: false,
          message: response.msg || "4K upscaling request failed",
        };
      }
    } catch (error) {
      console.error(
        "4K upscaling request failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : "4K upscaling request failed",
      };
    }
  }

  // Private method to attempt 1080P video retrieval
  private async get1080P(requestId: string): Promise<{
    hd_video_url?: string;
    hd_available: boolean;
    hd_processing: boolean;
  }> {
    try {
      const endpoint = `/get-1080p-video?taskId=${encodeURIComponent(
        requestId
      )}`;

      console.log(`🔍 1080P查询请求: ${this.baseUrl}${endpoint}`);
      const response = await this.makeRequest(endpoint, "GET");
      console.log(`🔍 1080P查询响应:`, JSON.stringify(response, null, 2));

      // API 返回 resultUrl 或 result_url（两者都可能存在）
      const hdVideoUrl = response.data?.resultUrl || response.data?.result_url || response.data?.videoUrl;
      if (response.code === 200 && hdVideoUrl) {
        return {
          hd_video_url: hdVideoUrl,
          hd_available: true,
          hd_processing: false,
        };
      } else if (response.code === 400 && response.msg?.includes("1080P")) {
        // 1080P still processing
        return {
          hd_available: false,
          hd_processing: true,
        };
      } else {
        // 1080P not available or other error
        console.warn(`⚠️ 1080P响应异常: code=${response.code}, msg=${response.msg}`);
        return {
          hd_available: false,
          hd_processing: false,
        };
      }
    } catch (error) {
      console.warn(
        "1080P retrieval failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return {
        hd_available: false,
        hd_processing: false,
      };
    }
  }

  async result(
    _model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    try {
      const statusResult = await this.status(_model, requestId);

      if (statusResult.status !== "COMPLETED") {
        return {
          request_id: requestId,
          status: statusResult.status,
          data: statusResult.raw_data,
        };
      }

      const rawData = statusResult.raw_data;
      const videoUrl = rawData?.response?.resultUrls?.[0] || null;

      const baseResult: VideoGenerationResult = {
        request_id: requestId,
        status: "COMPLETED",
        video_url: videoUrl,
        data: rawData,
      };

      // Try to get 1080P version
      const hd1080Result = await this.get1080P(requestId);

      return {
        ...baseResult,
        hd_video_url: hd1080Result.hd_video_url,
        hd_available: hd1080Result.hd_available,
        hd_processing: hd1080Result.hd_processing,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
