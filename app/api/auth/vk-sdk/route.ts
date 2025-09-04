import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { saveUser } from '@/services/user';
import { getUuid } from '@/lib/hash';
import { getIsoTimestr } from '@/lib/time';
import { getClientIp } from '@/lib/ip';
import { getDefaultAvatar } from '@/lib/avatar';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[VK SDK API] Received request body:', body);
    
    // 现在接收的是tokens而不是code
    const { access_token, refresh_token, id_token, user_id } = body;
    
    if (!access_token || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Tokens已经在前端获取，直接使用
    console.log('[VK SDK API] Using tokens from frontend:', {
      access_token: access_token ? 'present' : 'missing',
      refresh_token: refresh_token ? 'present' : 'missing',
      id_token: id_token ? 'present' : 'missing',
      user_id: user_id,
    });
    
    // 1. 获取用户信息
    const clientId = process.env.AUTH_VK_ID || '54107692';
    const userResponse = await fetch('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        access_token: access_token,
        client_id: clientId,  // VK API需要client_id
      }),
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Failed to fetch user info:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user info' },
        { status: 400 }
      );
    }
    
    const userInfo = await userResponse.json();
    console.log('[VK SDK API] User info received:', userInfo);
    const vkUser = userInfo.user || userInfo;
    
    // 2. 构建用户数据
    const email = vkUser.email || `vk_${vkUser.user_id || user_id}@vk.local`;
    const name = [vkUser.first_name, vkUser.last_name]
      .filter(Boolean)
      .join(' ') || `User ${vkUser.user_id}`;
    
    const dbUser = {
      uuid: getUuid(),
      email: email,
      nickname: name,
      avatar_url: vkUser.avatar || getDefaultAvatar(email),
      signin_type: 'oauth' as const,
      signin_provider: 'vk',
      signin_openid: String(vkUser.user_id),
      created_at: getIsoTimestr(),
      signin_ip: await getClientIp(),
    };
    
    // 3. 保存用户 - 复用现有逻辑
    const savedUser = await saveUser(dbUser);
    
    // 4. 创建NextAuth兼容的JWT token
    const sessionToken = {
      user: {
        uuid: savedUser.uuid,
        email: savedUser.email,
        nickname: savedUser.nickname,
        avatar_url: savedUser.avatar_url,
        created_at: savedUser.created_at,
        provider: 'vk',
      },
      isNewUser: savedUser.isNewUser,
    };
    
    const token = await encode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET!,
      salt: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
    });
    
    // 5. 设置cookie - 完全兼容NextAuth
    const cookieStore = cookies();
    // ngrok使用https，但开发环境不需要__Secure前缀
    const isProduction = process.env.NODE_ENV === 'production' && !req.headers.get('host')?.includes('ngrok');
    const cookieName = isProduction
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    
    console.log('[VK SDK API] Setting cookie:', {
      name: cookieName,
      secure: false,  // ngrok环境下不设置secure
      value: token ? 'present' : 'missing',
      env: process.env.NODE_ENV,
      host: req.headers.get('host')
    });
    
    // 对于ngrok，同时设置两个cookie以确保兼容性
    if (req.headers.get('host')?.includes('ngrok')) {
      // 设置非secure版本
      cookieStore.set({
        name: 'next-auth.session-token',
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    
    // 设置主cookie
    cookieStore.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: false,  // ngrok测试时关闭secure
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return NextResponse.json({ 
      success: true,
      user: {
        email: savedUser.email,
        name: savedUser.nickname,
        image: savedUser.avatar_url,
      }
    });
    
  } catch (error) {
    console.error('[VK SDK API] Auth error:', error);
    console.error('[VK SDK API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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