export const FALLBACK_TO_FAL_ENABLED =
  process.env.FALLBACK_TO_FAL_ENABLED === "true";

// 代理模型 -> fal 模型的映射
export const VIDEO_FALLBACK_MAP: Record<string, string> = {
  "kie-veo3-text-to-video": "fal-veo3.1-fast-text-to-video",
  "kie-veo3-image-to-video": "fal-veo3.1-fast-image-to-video",
  "kie-veo3-reference-to-video": "fal-veo3.1-reference-to-video",
  "sora-2-text-to-video": "fal-sora-2-text-to-video",
  "sora-2-image-to-video": "fal-sora-2-image-to-video",
};

export const IMAGE_FALLBACK_MAP: Record<string, string> = {
  "nano-banana": "fal-nano-banana",
  "nano-banana-edit": "fal-nano-banana-edit",
  "nano-banana-pro": "fal-nano-banana-pro",
  "nano-banana-pro-edit": "fal-nano-banana-pro-edit",
};

// fal 模型ID -> fal.ai endpoint 的映射
export const VIDEO_ENDPOINT_MAP: Record<string, string> = {
  "fal-veo3.1-fast-text-to-video": "fal-ai/veo3.1/fast",
  "fal-veo3.1-fast-image-to-video": "fal-ai/veo3.1/fast/first-last-frame-to-video",
  "fal-veo3.1-reference-to-video": "fal-ai/veo3.1/reference-to-video",
  "fal-sora-2-text-to-video": "fal-ai/sora-2/text-to-video",
  "fal-sora-2-image-to-video": "fal-ai/sora-2/image-to-video",
};

export const IMAGE_ENDPOINT_MAP: Record<string, string> = {
  "fal-nano-banana": "fal-ai/nano-banana",
  "fal-nano-banana-edit": "fal-ai/nano-banana/edit",
  "fal-nano-banana-pro": "fal-ai/nano-banana-pro",
  "fal-nano-banana-pro-edit": "fal-ai/nano-banana-pro/edit",
};

export const isRetryableProviderError = (error: unknown) => {
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = msg.toLowerCase();
  const not_retry_messages = [
    "The input or output was flagged as sensitive"
  ];
  return !not_retry_messages.some(message => lower.includes(message));
  // return (
  //   // 超时相
  //   lower.includes("timeout") ||
  //   lower.includes("timed out") ||
  //   lower.includes("etimedout") ||
  //   // 连接相关
  //   lower.includes("econnreset") ||
  //   lower.includes("econnrefused") ||
  //   lower.includes("enotfound") ||
  //   lower.includes("fetch failed") ||
  //   lower.includes("network error") ||
  //   // HTTP 错误码
  //   lower.includes("429") || // Rate Limit
  //   lower.includes("500") || // Internal Server Error
  //   lower.includes("502") || // Bad Gateway
  //   lower.includes("503") || // Service Unavailable
  //   lower.includes("504") || // Gateway Timeout
  //   // 服务状态相关
  //   lower.includes("service unavailable") ||
  //   lower.includes("gateway") ||
  //   lower.includes("rate limit") ||
  //   lower.includes("too many requests") ||
  //   // API特定错误
  //   lower.includes("provider error") ||
  //   lower.includes("upstream error")
  // );
  // return true;
};

