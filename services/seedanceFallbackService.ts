/**
 * Seedance 模型 Volcano 降级服务
 *
 * 临时方案：优先使用 Volcano（便宜），失败后降级到 BytePlus（稳定）
 *
 * 删除方法：
 * 1. 删除此文件
 * 2. 移除 submit/route.ts 中的 import 和 tryVolcanoSubmit 调用
 * 3. 删除环境变量 ENABLE_VOLCANO_FALLBACK
 */

import { VolcanoProvider } from "./providers/VolcanoProvider";
import {
  VideoGenerationRequest,
  VideoGenerationResponse,
} from "./providers/types";

// Volcano 模型 ID（火山引擎直连使用的模型标识）
const VOLCANO_SEEDANCE_MODEL_ID = "doubao-seedance-1-0-pro-250528";

/**
 * 检查是否启用 Volcano 降级
 */
export function isVolcanoFallbackEnabled(): boolean {
  return process.env.ENABLE_VOLCANO_FALLBACK === "true";
}

/**
 * 检查是否为 BytePlus Seedance 模型
 */
export function isBytePlusSeedanceModel(modelId: string): boolean {
  return modelId.includes("byteplus") && modelId.includes("seedance");
}

// Volcano Provider 单例
let volcanoProviderInstance: VolcanoProvider | null = null;

function getVolcanoProvider(): VolcanoProvider {
  if (!volcanoProviderInstance) {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new Error("ARK_API_KEY is required for Volcano fallback");
    }
    volcanoProviderInstance = new VolcanoProvider(apiKey);
  }
  return volcanoProviderInstance;
}

/**
 * 根据 metadata 中记录的 actual_provider 获取用于状态查询的 Provider
 *
 * @param actualProvider - metadata 中记录的实际 provider（"volcano" 或其他）
 * @returns VolcanoProvider 或 null
 */
export function getStatusProviderForFallback(
  actualProvider: string | undefined
): VolcanoProvider | null {
  if (actualProvider === "volcano") {
    console.log(
      "🌋 [Volcano Fallback] 检测到 actual_provider=volcano，使用 VolcanoProvider 查询状态"
    );
    return getVolcanoProvider();
  }

  return null;
}

/**
 * 尝试使用 Volcano 提交视频生成请求
 *
 * @param modelId - 原始模型 ID（如 byteplus-seedance-pro-text-to-video）
 * @param input - 视频生成请求参数
 * @param webhookUrl - Webhook 回调 URL
 * @returns 成功返回响应，失败返回 null（会自动降级到 BytePlus）
 */
export async function tryVolcanoSubmit(
  modelId: string,
  input: VideoGenerationRequest,
  webhookUrl?: string
): Promise<VideoGenerationResponse | null> {
  // 检查开关和模型类型
  if (!isVolcanoFallbackEnabled() || !isBytePlusSeedanceModel(modelId)) {
    return null;
  }

  try {
    console.log("🌋 [Volcano Fallback] 尝试使用火山引擎...");

    const volcanoProvider = getVolcanoProvider();

    // 构建 Volcano 专用 input，使用 Volcano 的模型 ID
    const volcanoInput: VideoGenerationRequest = {
      ...input,
      model: VOLCANO_SEEDANCE_MODEL_ID,
    };

    const response = await volcanoProvider.submit(
      modelId,
      volcanoInput,
      webhookUrl
    );

    console.log(
      "✅ [Volcano Fallback] 火山引擎请求成功, request_id:",
      response.request_id
    );

    return response;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(
      "⚠️ [Volcano Fallback] 火山引擎失败，将降级到 BytePlus:",
      errorMsg
    );
    return null;
  }
}
