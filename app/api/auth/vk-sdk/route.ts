import { NextRequest, NextResponse } from 'next/server';

// ⚠️ 这个API路由已废弃 - VK登录现在通过NextAuth Credentials Provider处理
// 参考: auth/config.ts 中的VK Credentials Provider
// 前端使用: signIn('vk', { access_token, user_id, ... })

export async function POST(req: NextRequest) {
  console.log('[VK SDK API - DEPRECATED] This endpoint is deprecated. Use NextAuth signIn("vk") instead.');
  
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated',
      message: 'VK login now uses NextAuth Credentials Provider. Use signIn("vk") from next-auth/react.',
      migration: {
        old: 'fetch("/api/auth/vk-sdk", { ... })',
        new: 'signIn("vk", { access_token, user_id, ... })'
      }
    },
    { status: 410 } // Gone
  );
}

// Callback端点（SDK的redirectUrl需要）
export async function GET(req: NextRequest) {
  // 这个端点主要是为了满足VK SDK的redirectUrl要求
  // 实际的处理在前端SDK的callback模式中完成
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>VK Login Callback</title>
      </head>
      <body>
        <script>
          // 这个页面会被VK SDK自动处理
          // 通过postMessage传递数据给父窗口
          window.close();
        </script>
      </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}