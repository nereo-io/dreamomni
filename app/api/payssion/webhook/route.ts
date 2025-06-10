// Payssion Webhook 处理

import { getPaymentRouter } from "@/services/payment";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log('Payssion webhook received');
    
    // 解析请求数据
    const contentType = req.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await req.json();
    } else {
      // Payssion 可能发送 form-urlencoded 数据
      const text = await req.text();
      const searchParams = new URLSearchParams(text);
      data = Object.fromEntries(searchParams);
    }
    
    console.log('Payssion webhook data:', data);
    
    // 使用支付路由器处理webhook
    const paymentRouter = getPaymentRouter();
    const result = await paymentRouter.handleWebhook('payssion', data);
    
    if (result.success) {
      console.log('Payssion webhook processed successfully:', result);
      
      // Payssion 期望返回 HTTP 200 状态码表示成功
      return new Response('OK', { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    } else {
      console.error('Payssion webhook processing failed:', result.error);
      return new Response(result.error || 'Webhook processing failed', { 
        status: 400,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
  } catch (error: any) {
    console.error('Payssion webhook error:', error);
    
    // 返回 500 错误，让 Payssion 重试
    return new Response(`Webhook error: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

// 处理 GET 请求（用于调试）
export async function GET(req: NextRequest) {
  return new Response('Payssion Webhook Endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}