'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useAppContext } from '@/contexts/app';

// VK SDK类型声明
declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export function VKLoginButton() {
  const router = useRouter();
  const { setShowSignModal } = useAppContext();
  
  useEffect(() => {
    // 动态加载VK SDK脚本
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;
    script.onload = () => {
      if (window.VKIDSDK) {
        const VKID = window.VKIDSDK;
        
        // 初始化SDK - 使用callback模式避免页面刷新
        // 对于测试环境（ngrok），使用当前域名；生产环境使用固定域名
        const baseUrl = window.location.origin; // 使用当前域名，支持ngrok测试
        
        // 确保App ID是数字类型（移除引号）
        const appId = 54107692; // VK要求必须是数字
        
        VKID.Config.init({
          app: appId,
          redirectUrl: `${baseUrl}/api/auth/vk-sdk/callback`,
          responseMode: VKID.ConfigResponseMode.Callback,
          scope: 'vkid.personal_info email',
          // 移除 source 参数，让SDK自动处理
        });
      }
    };
    document.head.appendChild(script);
    
    return () => {
      // 清理脚本
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  const handleLogin = async () => {
    if (!window.VKIDSDK) {
      toast.error('VK SDK is not loaded');
      return;
    }
    
    const VKID = window.VKIDSDK;
    console.log('[VK Login] Starting login process...');
    console.log('[VK Login] App ID:', 54107692);
    console.log('[VK Login] Redirect URL:', `${window.location.origin}/api/auth/vk-sdk/callback`);
    
    try {
      // 创建OneTap实例并设置事件监听
      const oneTap = new VKID.OneTap();
      
      // 监听登录成功事件
      oneTap.on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        console.log('[VK Login] Login success event received:', payload);
        const { code, device_id } = payload;
        
        console.log('[VK Login] Code:', code);
        console.log('[VK Login] Device ID:', device_id);
        
        try {
          // 在前端交换token（因为没有使用PKCE）
          console.log('[VK Login] Exchanging code for tokens on frontend...');
          const tokens = await VKID.Auth.exchangeCode(code, device_id);
          console.log('[VK Login] Tokens received:', {
            access_token: tokens.access_token ? 'present' : 'missing',
            refresh_token: tokens.refresh_token ? 'present' : 'missing',
            id_token: tokens.id_token ? 'present' : 'missing',
            user_id: tokens.user_id
          });
          
                     // 使用NextAuth的signIn处理登录
           console.log('[VK Login] Using NextAuth signIn with credentials');
           
           const result = await signIn('vk', {
             access_token: tokens.access_token,
             refresh_token: tokens.refresh_token,
             id_token: tokens.id_token,
             user_id: tokens.user_id,
             redirect: false, // 不自动重定向，手动处理
           });
           
           console.log('[VK Login] NextAuth signIn result:', result);
           
           if (result?.ok && !result?.error) {
             toast.success('Login successful!');
             setShowSignModal(false); // 关闭登录弹窗
             router.push('/pricing');
             router.refresh();
           } else {
             console.error('[VK Login] NextAuth signIn failed:', result?.error);
             toast.error(result?.error || 'VK login failed');
           }
        } catch (error) {
          console.error('Backend processing error:', error);
          toast.error('Failed to process login');
        }
      });
      
      // 监听错误事件
      oneTap.on(VKID.WidgetEvents.ERROR, (error: any) => {
        console.error('[VK Login] SDK Error:', error);
        toast.error(`VK login error: ${error.message || 'Unknown error'}`);
      });
      
      // 使用Auth.login()触发登录
      console.log('[VK Login] Calling VKID.Auth.login()...');
      VKID.Auth.login()
        .then(async (authInfo: any) => {
          console.log('[VK Login] Auth.login response:', authInfo);
          // 如果不是callback模式，手动处理
          if (authInfo && authInfo.code && authInfo.device_id) {
            try {
              // 在前端交换token
              console.log('[VK Login] Exchanging code for tokens...');
              const tokens = await VKID.Auth.exchangeCode(authInfo.code, authInfo.device_id);
              console.log('[VK Login] Tokens received:', {
                access_token: tokens.access_token ? 'present' : 'missing',
                user_id: tokens.user_id
              });
              
              // 使用NextAuth的signIn处理登录
              console.log('[VK Login] Using NextAuth signIn with credentials (Auth.login path)');
              
              const result = await signIn('vk', {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                id_token: tokens.id_token,
                user_id: tokens.user_id,
                redirect: false, // 不自动重定向，手动处理
              });
              
              console.log('[VK Login] NextAuth signIn result (Auth.login path):', result);
              
              if (result?.ok && !result?.error) {
                toast.success('Login successful!');
                setShowSignModal(false); // 关闭登录弹窗
                router.push('/pricing');
                router.refresh();
              } else {
                console.error('[VK Login] NextAuth signIn failed (Auth.login path):', result?.error);
                toast.error(result?.error || 'VK login failed');
              }
            } catch (error) {
              console.error('[VK Login] Token exchange error:', error);
              toast.error('Failed to exchange code for tokens');
            }
          }
        })
        .catch((error: any) => {
          console.error('[VK Login] Auth.login error:', error);
          toast.error(`VK login failed: ${error.message || 'Unknown error'}`);
        });
        
    } catch (error) {
      console.error('VK login error:', error);
      toast.error('Failed to initialize VK login');
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleLogin}
      className="w-full"
      type="button"
    >
      <svg
        className="mr-2 h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.65 20h-1.3c-.55 0-.85-.35-.7-.85l.7-2.3c.15-.5-.15-.85-.65-.85H8.4c-.5 0-.9-.35-1.05-.85l-2.3-7.7C4.9 6.95 5.2 6.5 5.7 6.5h3.15c.5 0 .9.35 1.05.85l1.5 5c.15.5.65.85 1.15.85h2.75c.5 0 1 .35 1.15.85l1.5 5c.15.5-.15.85-.65.85h-2.65c-.5 0-.8.35-.65.85l.7 2.3c.15.5-.15.85-.65.85z"
          fill="#0077FF"
        />
      </svg>
      Continue with VK
    </Button>
  );
}