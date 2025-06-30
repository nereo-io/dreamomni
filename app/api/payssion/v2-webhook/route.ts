// Payssion V2 Webhook 处理

import { getPaymentRouter } from "@/services/payment";
import { NextRequest } from "next/server";
import * as crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // 获取原始请求体和签名
    const payload = await req.text();
    const signature =
      req.headers.get("Payssion-Signature") ||
      req.headers.get("X-Payssion-Signature") ||
      "";

    // 解析事件类型用于日志
    let eventType = "unknown";
    try {
      const data = JSON.parse(payload);
      eventType = data.type || "unknown";
    } catch (e) {
      // 忽略解析错误，继续处理
    }

    console.log(`🎯 Webhook: ${eventType}`);

    // 强制启用签名验证以确保安全性
    if (signature) {
      const signingSecret = process.env.PAYSSION_V2_SECRET_KEY || "";

      if (!signingSecret) {
        console.error("❌ Missing API key for signature verification");
        return new Response("Missing API key for signature verification", {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      const expectedSignature = crypto
        .createHmac("sha256", signingSecret)
        .update(payload)
        .digest("hex");

      const signatureValid = expectedSignature === signature;
      console.log(
        `🔐 Signature verification: ${signatureValid ? "VALID" : "INVALID"}`
      );

      if (!signatureValid) {
        console.error("❌ Signature validation failed - rejecting webhook");
        return new Response("Signature validation failed", {
          status: 401,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }
    } else if (!signature) {
      console.error("❌ Missing signature in webhook request");
      return new Response("Missing signature", {
        status: 401,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // 解析 JSON 数据
    let data: any;
    try {
      data = JSON.parse(payload);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response("Invalid JSON", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // 移除详细数据日志，只在需要时输出

    // 使用支付路由器处理 V2 订阅 webhook
    const paymentRouter = getPaymentRouter();
    const payssionProvider = paymentRouter.getProvider("payssion");

    if (!payssionProvider || !payssionProvider.handleSubscriptionWebhook) {
      console.error(
        "❌ Payssion provider or handleSubscriptionWebhook method not found"
      );
      return new Response("Provider not found", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // 立即返回 200 给 Payssion，避免超时重发
    const response = new Response("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    // 异步处理 webhook 业务逻辑
    setImmediate(async () => {
      try {
        const result = await payssionProvider.handleSubscriptionWebhook!(data);
        if (result.success) {
          console.log(`✅ ${eventType} processed`);
        } else {
          console.error(`❌ ${eventType} failed:`, result.error);
        }
      } catch (error: any) {
        console.error(
          "❌ Async webhook processing failed:",
          error,
          `eventType: ${eventType}`
        );
      }
    });

    return response;
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);

    // 返回 500 错误，让 Payssion 重试
    return new Response(`Webhook error: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

// 处理 GET 请求（用于调试）
export async function GET(req: NextRequest) {
  return new Response("Payssion V2 Webhook Endpoint", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
