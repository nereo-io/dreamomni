import { NextRequest, NextResponse } from 'next/server';

// VK SDK Callback端点
export async function GET(req: NextRequest) {
  // 这个端点是VK SDK的redirectUrl
  // 它会被SDK通过iframe或popup访问
  // SDK会通过postMessage将数据传递给主窗口
  
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>VK Login Processing...</title>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <div>Processing VK login...</div>
          </div>
        </div>
        <script>
          // VK SDK会通过postMessage传递数据
          // 这个页面会自动关闭或重定向
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = '/dashboard';
            }
          }, 2000);
        </script>
      </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  // 如果VK SDK使用POST方式回调
  return GET(req);
}