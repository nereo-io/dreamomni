// 地理位置检测 Hook

import { useState, useEffect } from "react";

export interface LocationInfo {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  ip?: string;
  detected: boolean;
  error?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationInfo>({
    country: "Unknown",
    countryCode: "XX",
    detected: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentLocale, setCurrentLocale] = useState<string>("en");

  useEffect(() => {
    // 客户端安全获取当前 locale
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split("/");
      const urlLocale = pathSegments[1];
      // console.log("检测到的locale:", urlLocale);

      if (urlLocale === "ru") {
        setCurrentLocale(urlLocale);
      }
    }
  }, []);

  // 当 locale 变化时重新检测位置
  useEffect(() => {
    detectLocation();
  }, [currentLocale]);

  const detectLocation = async () => {
    try {
      // 1. 语言检测（优先级最高，最快）
      const languageLocation = detectFromLanguage();
      if (languageLocation.detected) {
        setLocation(languageLocation);
        setLoading(false);
        return;
      }

      // 2. 时区检测（次优先级）
      const timezoneLocation = detectFromTimezone();
      if (timezoneLocation.detected) {
        setLocation(timezoneLocation);
        setLoading(false);
        return;
      }

      // 3. 非俄罗斯地区 -> 默认为"其他地区"，触发 Creem 支付
      setLocation({
        country: "Other",
        countryCode: "XX",
        detected: false,
      });
      setLoading(false);
    } catch (error) {
      // 异常情况也默认为"其他地区"
      setLocation({
        country: "Other",
        countryCode: "XX",
        detected: false,
      });
      setLoading(false);
    }
  };

  // 通过服务器端 IP 地理位置检测
  const detectFromServer = async (): Promise<LocationInfo> => {
    try {
      const response = await fetch("/api/geolocation", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data && result.data.countryCode) {
          return {
            country: result.data.country || result.data.countryCode,
            countryCode: result.data.countryCode,
            region: result.data.region,
            city: result.data.city,
            ip: result.data.ip,
            detected: result.data.detected || true,
          };
        }
      }
    } catch (error) {
      console.log("Cloudflare geolocation not available:", error);
    }

    return { country: "Unknown", countryCode: "XX", detected: false };
  };

  // 通过时区推测位置（备选）
  const detectFromTimezone = (): LocationInfo => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // 简单的时区到国家映射
      const timezoneCountryMap: Record<
        string,
        { country: string; countryCode: string }
      > = {
        "Europe/Moscow": { country: "Russia", countryCode: "RU" },
        "Asia/Yekaterinburg": { country: "Russia", countryCode: "RU" },
        "Asia/Novosibirsk": { country: "Russia", countryCode: "RU" },
        "Asia/Krasnoyarsk": { country: "Russia", countryCode: "RU" },
        "Asia/Irkutsk": { country: "Russia", countryCode: "RU" },
        "Asia/Vladivostok": { country: "Russia", countryCode: "RU" },
        "Europe/Kiev": { country: "Ukraine", countryCode: "UA" },
        "Europe/Minsk": { country: "Belarus", countryCode: "BY" },
        "Asia/Almaty": { country: "Kazakhstan", countryCode: "KZ" },
        "America/New_York": { country: "United States", countryCode: "US" },
        "America/Los_Angeles": { country: "United States", countryCode: "US" },
        "Europe/London": { country: "United Kingdom", countryCode: "GB" },
        "Europe/Berlin": { country: "Germany", countryCode: "DE" },
        "Asia/Shanghai": { country: "China", countryCode: "CN" },
        "Asia/Tokyo": { country: "Japan", countryCode: "JP" },
      };

      const locationInfo = timezoneCountryMap[timezone];
      if (locationInfo) {
        return {
          ...locationInfo,
          detected: true,
        };
      }

      // 如果没有匹配到具体时区，不要猜测，返回未检测状态
      // 让主流程继续到下一步或使用默认值
    } catch (error) {
      console.log("Timezone detection failed:", error);
    }

    return { country: "Unknown", countryCode: "XX", detected: false };
  };

  // 通过网站 locale 推测位置（只检查网站语言，不检查浏览器语言）
  const detectFromLanguage = (): LocationInfo => {
    try {
      // 只检查网站当前语言设置
      // 注意：不再检查浏览器语言，因为哈萨克斯坦等独联体国家用户
      // 浏览器语言可能是俄语，但他们无法使用俄罗斯本土支付方式
      if (currentLocale === "ru") {
        return {
          country: "Russia",
          countryCode: "RU",
          detected: true,
        };
      }
    } catch (error) {
      console.log("Language detection failed:", error);
    }

    return { country: "Unknown", countryCode: "XX", detected: false };
  };

  // 判断是否为俄罗斯
  const isRussia = () => {
    return location.countryCode === "RU";
  };

  // 判断是否应该使用 Payssion 支付（综合判断）
  const shouldUsePayssion = () => {
    // 1. 优先：用户主动选择了俄语界面
    if (currentLocale === "ru") {
      return true;
    }

    // 2. 其次：地理位置是俄罗斯
    return isRussia();
  };

  return {
    location,
    loading,
    // isRussia: isRussia(),
    // shouldUsePayssion: shouldUsePayssion(),
    isRussia: false,
    shouldUsePayssion: false,
    refresh: detectLocation,
  };
}
