'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useAppContext } from '@/contexts/app';
import { useTranslations } from 'next-intl';
import { SiVk } from 'react-icons/si';

// VK SDK类型声明
declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export function VKLoginButton() {
  const router = useRouter();
  const { setShowSignModal } = useAppContext();
  const t = useTranslations('vk_login');
  
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
      toast.error(t('sdk_not_loaded'));
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
             toast.success(t('login_successful'));
             setShowSignModal(false); // 关闭登录弹窗
            //  router.push('/pricing');
             router.refresh();
           } else {
             console.error('[VK Login] NextAuth signIn failed:', result?.error);
             toast.error(result?.error || t('login_failed'));
           }
        } catch (error) {
          console.error('Backend processing error:', error);
          toast.error(t('failed_to_process'));
        }
      });
      
      // 监听错误事件
      oneTap.on(VKID.WidgetEvents.ERROR, (error: any) => {
        console.error('[VK Login] SDK Error:', error);
        toast.error(t('error_message', { message: error.message || t('error_unknown') }));
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
                toast.success(t('login_successful'));
                setShowSignModal(false); // 关闭登录弹窗
                // router.push('/pricing');
                router.refresh();
              } else {
                console.error('[VK Login] NextAuth signIn failed (Auth.login path):', result?.error);
                toast.error(result?.error || t('login_failed'));
              }
            } catch (error) {
              console.error('[VK Login] Token exchange error:', error);
              toast.error(t('failed_to_exchange'));
            }
          }
        })
        .catch((error: any) => {
          console.error('[VK Login] Auth.login error:', error);
          toast.error(t('error_message', { message: error.message || t('error_unknown') }));
        });
        
    } catch (error) {
      console.error('VK login error:', error);
      toast.error(t('failed_to_initialize'));
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleLogin}
      className="w-full flex items-center gap-2"
      type="button"
    >
      <SiVk className="w-4 h-4" />
      {t('button_text')}
    </Button>
  );
}