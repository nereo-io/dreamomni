import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

export class Veo3Provider implements VideoProvider {
  private baseUrl = "https://api.apicore.ai/v1/chat/completions";
  private statusBaseUrl = "https://asyncdata.net/source";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Veo3 APICore API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "veo3";
  }


  private async makeStreamingRequest(
    model: string,
    prompt: string,
    images: string[] = []
  ): Promise<{ taskId: string; chunks: string[] }> {
    const requestPayload = {
      model: model,
      messages: [
        {
          role: "user",
          content:
            images.length > 0
              ? [
                  {
                    type: "text",
                    text: prompt,
                  },
                  ...images.map((imageUrl: string) => ({
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  })),
                ]
              : prompt,
        },
      ],
      stream: true,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      // Log detailed error information for debugging
      console.error("Veo3 API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorData,
        prompt,
        imageCount: images.length,
        images: images,
        requestPayload: JSON.stringify(requestPayload, null, 2),
      });

      throw new Error(
        `Veo3 API Error: ${response.status} - ${
          errorData.error?.message || errorText
        }`
      );
    }

    // Parse streaming response to extract task ID
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allChunks = [];
      let taskId = null;

      try {
        // Read first few chunks to get task ID
        for (let i = 0; i < 5; i++) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          allChunks.push(chunk);

          // Try to extract task ID from content
          if (chunk.includes("Task ID:")) {
            const match = chunk.match(/Task ID: `([^`]+)`/);
            if (match) {
              taskId = match[1];
              break;
            }
          }
        }

        if (!taskId) {
          throw new Error("Failed to extract task ID from streaming response");
        }

        return { taskId, chunks: allChunks };
      } catch (streamError) {
        throw new Error(
          `Failed to process streaming response: ${
            streamError instanceof Error
              ? streamError.message
              : "Unknown stream error"
          }`
        );
      }
    }

    throw new Error("No response body received from Veo3 API");
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    _webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    try {
      // Extract images if provided
      const images = input.image_url ? [input.image_url] : [];

      // Use only veo3 model (we configured it as "veo3-apicore" but API expects "veo3")
      const apiModel = "veo3";

      const { taskId, chunks } = await this.makeStreamingRequest(
        apiModel,
        input.prompt,
        images
      );

      return {
        request_id: taskId,
        status: "submitted",
        model: model,
        task_id: taskId,
        chunks: chunks,
      };
    } catch (error) {
      throw new Error(
        `Veo3 Provider submit failed: ${
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
      const statusUrl = `${this.statusBaseUrl}/${requestId}`;

      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(
          `Status check failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Map Veo3 status to standard status
      let standardStatus = "unknown";

      // Handle completed states
      if (
        data.running === false &&
        (data.status === "completed" ||
          data.status === "video_generation_completed")
      ) {
        standardStatus = "completed";
      }
      // Handle running states
      else if (data.running === true) {
        if (
          data.status === "video_generating" ||
          data.status === "video_generation_running"
        ) {
          standardStatus = "in_progress";
        } else if (
          data.status === "video_upsampling" ||
          data.status === "upsampling"
        ) {
          standardStatus = "in_progress";
        } else if (data.status === "processing" || data.status === "pending") {
          standardStatus = "in_queue";
        } else {
          standardStatus = "in_queue"; // Default for running states
        }
      }
      // Handle failed states
      else if (data.status === "failed" || data.status === "error") {
        standardStatus = "failed";
      }
      // Handle special completed states even when running is not explicitly false
      else if (
        data.status === "completed" ||
        data.status === "video_generation_completed"
      ) {
        standardStatus = "completed";
      }

      return {
        request_id: requestId,
        status: standardStatus,
        progress: data.running ? 50 : 100, // Rough progress estimate
        logs: data.logs || [],
        metrics: data.metrics || {},
        raw_data: data, // Keep original data for debugging
      };
    } catch (error) {
      throw new Error(
        `Veo3 Provider status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async result(
    _model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    try {
      // First get the status to ensure it's completed
      const statusResult = await this.status(_model, requestId);

      if (statusResult.status !== "completed") {
        return {
          request_id: requestId,
          status: statusResult.status,
          data: statusResult.raw_data,
        };
      }

      // Extract video URLs from the raw data
      const rawData = statusResult.raw_data;
      let videoUrl = null;
      let upsampleVideoUrl = null;

      if (rawData?.video_url) {
        videoUrl = rawData.video_url;
      }

      if (rawData?.upsample_video_url) {
        upsampleVideoUrl = rawData.upsample_video_url;
      }

      return {
        request_id: requestId,
        status: "completed",
        video_url: videoUrl,
        upsample_video_url: upsampleVideoUrl,
        data: rawData,
      };
    } catch (error) {
      throw new Error(
        `Veo3 Provider result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}