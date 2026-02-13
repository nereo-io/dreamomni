export interface ParsedVideoWebhookPayload {
  request_id: string;
  status: string;
  logs: any[];
  metrics: any;
  error: string | null;
  payload: any;
}

function extractKieResultUrl(kieData: any): string | null {
  const resultUrls = kieData?.info?.resultUrls;
  if (Array.isArray(resultUrls) && resultUrls.length > 0) {
    return resultUrls[0];
  }

  const resultJsonRaw = kieData?.resultJson;
  if (!resultJsonRaw) {
    return null;
  }

  try {
    const resultJson = JSON.parse(resultJsonRaw);
    if (Array.isArray(resultJson?.resultUrls) && resultJson.resultUrls.length > 0) {
      return resultJson.resultUrls[0];
    }
  } catch (parseError) {
    console.error("解析 KieAI resultJson 失败:", parseError);
  }

  return null;
}

export function parseVideoWebhookPayload(
  webhookData: any
): ParsedVideoWebhookPayload {
  // fal.ai format
  if (webhookData.request_id) {
    return {
      request_id: webhookData.request_id,
      status: webhookData.status,
      logs: webhookData.logs || [],
      metrics: webhookData.metrics || {},
      error: webhookData.error || null,
      payload: webhookData.payload || null,
    };
  }

  // Evolink format: { id, object, status, results?, model, progress }
  if (webhookData.object === "video.generation.task") {
    const evolinkStatus = (webhookData.status || "").toLowerCase();
    let status = evolinkStatus;
    let payload: any = null;
    let error: string | null = null;

    if (
      evolinkStatus === "completed" &&
      Array.isArray(webhookData.results) &&
      webhookData.results.length > 0
    ) {
      status = "OK";
      payload = {
        video: {
          url: webhookData.results[0],
        },
      };
    } else if (evolinkStatus === "failed") {
      status = "ERROR";
      error = webhookData.error?.message || "Evolink generation failed";
    } else if (evolinkStatus === "processing") {
      status = "IN_PROGRESS";
    } else if (evolinkStatus === "pending") {
      status = "IN_QUEUE";
    }

    return {
      request_id: webhookData.id,
      status,
      logs: [],
      metrics: {},
      error,
      payload,
    };
  }

  // Volcano format
  if (webhookData.id || webhookData.task_id) {
    const request_id = webhookData.id || webhookData.task_id;
    let status = webhookData.status;
    let payload: any = null;
    let error: string | null = null;

    switch (webhookData.status) {
      case "queued":
        status = "IN_QUEUE";
        break;
      case "running":
        status = "IN_PROGRESS";
        break;
      case "succeeded":
        status = "OK";
        break;
      case "failed":
        status = "ERROR";
        break;
      case "cancelled":
        status = "CANCELLED";
        break;
      default:
        status = webhookData.status;
        break;
    }

    if (webhookData.content?.video_url) {
      payload = {
        video: {
          url: webhookData.content.video_url,
        },
      };
    }

    if (webhookData.error) {
      error = webhookData.error.message || webhookData.error;
    }

    return {
      request_id,
      status,
      logs: [],
      metrics: {},
      error,
      payload,
    };
  }

  // Kie.ai format
  if (webhookData.code !== undefined && webhookData.data?.taskId) {
    const request_id = webhookData.data.taskId;
    let status = "ERROR";
    let payload: any = null;
    let error: string | null = null;
    const kieData = webhookData.data;
    const state = (kieData?.state || "").toString().toLowerCase();
    const failCode = kieData?.failCode;
    const failMessage =
      kieData?.failMsg ||
      (failCode !== null && failCode !== undefined
        ? `KieAI failCode: ${failCode}`
        : null) ||
      webhookData.msg ||
      "KieAI generation failed";

    if (webhookData.code !== 200) {
      status = "ERROR";
      error = failMessage;
    } else if (state === "waiting" || state === "pending") {
      status = "IN_QUEUE";
    } else if (state === "processing") {
      status = "IN_PROGRESS";
    } else if (state === "fail" || (failCode !== null && failCode !== undefined)) {
      status = "ERROR";
      error = failMessage;
    } else {
      // success and backward-compatibility paths both rely on the same result extraction.
      const videoUrl = extractKieResultUrl(kieData);
      if (videoUrl) {
        status = "OK";
        payload = {
          video: {
            url: videoUrl,
          },
        };
      } else {
        status = "ERROR";
        error =
          state && state !== "success"
            ? webhookData.msg || "KieAI callback state is unknown"
            : "KieAI result missing video URL";
      }
    }

    return {
      request_id,
      status,
      logs: [],
      metrics: {},
      error,
      payload,
    };
  }

  throw new Error("无效的 webhook 数据格式");
}
