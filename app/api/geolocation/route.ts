// 地理位置检测 API

import { respData, respErr } from "@/lib/resp";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 从请求头获取地理位置信息
    const headers = req.headers;
    
    // Cloudflare 提供的地理位置头信息
    const cfCountry = headers.get('cf-ipcountry');
    const cfRegion = headers.get('cf-region');
    const cfCity = headers.get('cf-city');
    
    // Vercel 提供的地理位置头信息
    const vercelCountry = headers.get('x-vercel-ip-country');
    const vercelRegion = headers.get('x-vercel-ip-country-region');
    const vercelCity = headers.get('x-vercel-ip-city');
    
    // 其他常见的地理位置头信息
    const xForwardedFor = headers.get('x-forwarded-for');
    const xRealIp = headers.get('x-real-ip');
    const userAgent = headers.get('user-agent');
    
    // 优先使用 Cloudflare 的地理位置信息
    let countryCode = cfCountry || vercelCountry;
    let region = cfRegion || vercelRegion;
    let city = cfCity || vercelCity;
    
    // 国家名称映射
    const countryNames: Record<string, string> = {
      'RU': 'Russia',
      'US': 'United States',
      'CN': 'China',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'KR': 'South Korea',
      'BY': 'Belarus',
      'KZ': 'Kazakhstan',
      'UA': 'Ukraine',
      'IN': 'India',
      'BR': 'Brazil',
      'CA': 'Canada',
      'AU': 'Australia',
    };
    
    if (countryCode) {
      return respData({
        countryCode: countryCode.toUpperCase(),
        country: countryNames[countryCode.toUpperCase()] || countryCode,
        region: region,
        city: city,
        ip: xForwardedFor?.split(',')[0] || xRealIp,
        userAgent: userAgent,
        detected: true,
        source: cfCountry ? 'cloudflare' : 'vercel',
      });
    }
    
    // 尝试通过免费的IP地理位置服务获取
    const clientIP = xForwardedFor?.split(',')[0] || xRealIp;
    if (clientIP && clientIP !== '127.0.0.1' && clientIP !== '::1') {
      try {
        // 使用免费的 ipapi.co 服务
        const ipApiResponse = await fetch(`https://ipapi.co/${clientIP}/json/`, {
          timeout: 3000,
        } as any);
        
        if (ipApiResponse.ok) {
          const ipData = await ipApiResponse.json();
          if (ipData.country_code) {
            return respData({
              countryCode: ipData.country_code.toUpperCase(),
              country: ipData.country_name || ipData.country_code,
              region: ipData.region,
              city: ipData.city,
              ip: clientIP,
              detected: true,
              source: 'ipapi',
            });
          }
        }
      } catch (error) {
        console.log('IP geolocation service failed:', error);
      }
    }
    
    // 如果没有地理位置信息，返回默认值
    return respData({
      countryCode: 'US',
      country: 'United States',
      detected: false,
      source: 'default',
      ip: clientIP,
      userAgent: userAgent,
    });
    
  } catch (error: any) {
    console.error("Geolocation API error:", error);
    return respErr(`地理位置检测失败: ${error.message}`);
  }
}

// POST 方法支持手动设置位置
export async function POST(req: NextRequest) {
  try {
    const { countryCode, country } = await req.json();
    
    if (!countryCode) {
      return respErr("缺少国家代码");
    }
    
    const countryNames: Record<string, string> = {
      'RU': 'Russia',
      'US': 'United States',
      'CN': 'China',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'KR': 'South Korea',
      'BY': 'Belarus',
      'KZ': 'Kazakhstan',
      'UA': 'Ukraine',
    };
    
    return respData({
      countryCode: countryCode.toUpperCase(),
      country: country || countryNames[countryCode.toUpperCase()] || countryCode,
      detected: true,
      source: 'manual',
    });
    
  } catch (error: any) {
    console.error("Manual geolocation setting error:", error);
    return respErr(`设置位置失败: ${error.message}`);
  }
}