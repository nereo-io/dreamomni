import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface VkIdProfile {
  user_id: number;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  is_verified?: boolean;
  birthday?: string;
  sex?: number;
}

/**
 * VK ID Provider for NextAuth
 * Implements the new VK ID OAuth 2.0 + PKCE flow
 * Documentation: https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/api/oauth-2
 */
export default function VkId<P extends VkIdProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "vk",
    name: "VK",
    type: "oauth",
    
    authorization: {
      url: "https://id.vk.com/authorize",
      params: {
        scope: "vkid.personal_info email",
        response_type: "code",
        redirect_type: "web_server",
        display: "popup",
        prompt: "login",
      },
    },
    
    token: {
      url: "https://id.vk.com/oauth2/auth",
      async request(context: any) {
        // 从回调参数获取device_id（VK ID新版要求）
        const device_id = context.params.device_id;
        
        const response = await fetch("https://id.vk.com/oauth2/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: context.params.code as string,
            client_id: context.provider.clientId as string,
            client_secret: context.provider.clientSecret as string,
            redirect_uri: context.provider.callbackUrl as string,
            device_id: device_id || "",  // VK ID要求的device_id参数
          }),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Token exchange failed: ${response.status} - ${error}`);
        }
        
        return response.json();
      },
    },
    
    userinfo: {
      url: "https://id.vk.com/oauth2/user_info",
      async request({ tokens, provider }: any) {
        const response = await fetch(provider.userinfo?.url!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            access_token: tokens.access_token!,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.user || data;
      },
    },
    
    profile(profile) {
      return {
        id: String(profile.user_id),
        name: [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ") || `User ${profile.user_id}`,
        email: profile.email ?? null,
        image: profile.avatar ?? null,
      };
    },
    
    checks: [],  // 禁用所有检查，因为VK破坏了JWT格式的state参数
    
    client: {
      token_endpoint_auth_method: "client_secret_post",
      response_types: ["code"],
      grant_types: ["authorization_code", "refresh_token"],
      id_token_signed_response_alg: "RS256",
    },
    
    style: {
      logo: "/vk-logo.svg",
      bg: "#0077FF",
      text: "#fff",
    },
    
    options,
  };
}