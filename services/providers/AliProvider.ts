import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";
import { getVideoModel } from "@/config/video-models";

export class AliProvider implements VideoProvider {
  private baseUrl = "https://dashscope.aliyuncs.com";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Ali API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "ali";
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      headers["X-DashScope-Async"] = "enable";
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    const responseData = await response.json();

    if (!response.ok) {
      const errorCode = responseData.code || "Unknown";
      const errorMessage = responseData.message || response.statusText;
      throw new Error(`Ali API error: ${errorCode} - ${errorMessage}`);
    }

    return responseData;
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    const endpoint = "/api/v1/services/aigc/video-generation/video-synthesis";

    // 获取实际的阿里云模型ID
    const aliModelId = this.getAliModelId(model);

    // 构建请求体
    const requestBody: any = {
      model: aliModelId,
      input: {
        prompt: input.prompt,
      },
      parameters: {},
    };

    // 处理图生视频
    if (input.image_url) {
      requestBody.input.img_url = input.image_url;
    }

    // 处理分辨率
    if (aliModelId === "wan2.2-t2v-plus") {
      // 文生视频使用 size 参数
      if (input.resolution === "1080p") {
        if (input.aspect_ratio === "16:9") {
          requestBody.parameters.size = "1920*1080";
        } else if (input.aspect_ratio === "9:16") {
          requestBody.parameters.size = "1080*1920";
        } else if (input.aspect_ratio === "1:1") {
          requestBody.parameters.size = "1440*1440";
        } else {
          requestBody.parameters.size = "1920*1080"; // 默认
        }
      } else {
        // 480p
        if (input.aspect_ratio === "16:9") {
          requestBody.parameters.size = "832*480";
        } else if (input.aspect_ratio === "9:16") {
          requestBody.parameters.size = "480*832";
        } else if (input.aspect_ratio === "1:1") {
          requestBody.parameters.size = "624*624";
        } else {
          requestBody.parameters.size = "832*480"; // 默认
        }
      }
    } else if (aliModelId === "wan2.2-i2v-plus") {
      // 图生视频使用 resolution 参数
      requestBody.parameters.resolution =
        input.resolution === "1080p" ? "1080P" : "480P";
    }

    console.log(
      "🎯 阿里百炼视频生成请求参数:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await this.makeRequest(endpoint, "POST", requestBody);

    return {
      request_id: response.output.task_id,
      status: "submitted",
      model: model,
      raw_response: response,
    };
  }

  async status(
    model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    const endpoint = `/api/v1/tasks/${requestId}`;

    const response = await this.makeRequest(endpoint, "GET");

    // 映射阿里云状态到标准状态
    let standardStatus = "unknown";
    switch (response.output.task_status) {
      case "PENDING":
        standardStatus = "IN_QUEUE";
        break;
      case "RUNNING":
        standardStatus = "IN_PROGRESS";
        break;
      case "SUCCEEDED":
        standardStatus = "COMPLETED";
        break;
      case "FAILED":
        standardStatus = "FAILED";
        break;
      case "CANCELED":
        standardStatus = "CANCELLED";
        break;
      case "UNKNOWN":
        standardStatus = "UNKNOWN";
        break;
      default:
        standardStatus = response.output.task_status;
    }

    // 处理错误信息
    let errorMessage = null;
    if (response.output.code && response.output.message) {
      errorMessage = this.getErrorMessage(
        response.output.code,
        response.output.message
      );
    }

    return {
      request_id: requestId,
      status: standardStatus,
      error_message: errorMessage || "",
      raw_response: response,
    };
  }

  async result(
    model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    const statusResponse = await this.status(model, requestId);

    if (statusResponse.status !== "COMPLETED") {
      throw new Error(
        `Task not completed. Current status: ${statusResponse.status}`
      );
    }

    const rawResponse = (statusResponse as any).raw_response;
    const videoUrl = rawResponse?.output?.video_url;

    if (!videoUrl) {
      throw new Error("Video URL not found in completed task response");
    }

    return {
      request_id: requestId,
      status: "COMPLETED",
      video_url: videoUrl,
      data: {
        video_url: videoUrl,
        usage: rawResponse?.usage || {},
        orig_prompt: rawResponse?.output?.orig_prompt,
        actual_prompt: rawResponse?.output?.actual_prompt,
        submit_time: rawResponse?.output?.submit_time,
        scheduled_time: rawResponse?.output?.scheduled_time,
        end_time: rawResponse?.output?.end_time,
      },
      raw_response: rawResponse,
    };
  }

  private getErrorMessage(code: string, message: string): string {
    switch (code) {
      case "InvalidParameter":
        return "Invalid request parameters, please check your input";
      case "IPInfringementSuspect":
        return "Input content may involve intellectual property infringement risk, please modify and try again";
      case "DataInspectionFailed":
        return "Input content may contain sensitive information, please modify and try again";
      case "InternalError":
        return "Service temporarily unavailable, please try again later";
      default:
        return message || "Video generation failed, please try again";
    }
  }

  private getAliModelId(model: string): string {
    // 从配置中获取实际的阿里云模型ID
    const modelConfig = getVideoModel(model);
    if (modelConfig && modelConfig.aliModel) {
      return modelConfig.aliModel;
    }
    // 如果找不到配置，假设传入的就是阿里云模型ID
    return model;
  }
}
