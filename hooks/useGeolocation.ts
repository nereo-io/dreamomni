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
    countryCode: "US",
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

      // 3. 服务器端 IP 检测（最后备选，需要网络请求）
      // const serverLocation = await detectFromServer();
      // setLocation(serverLocation);
      // setLoading(false);
    } catch (error) {
      // 默认美国
      setLocation({
        country: "United States",
        countryCode: "US",
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

    return { country: "Unknown", countryCode: "US", detected: false };
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

      // 如果没有匹配，根据时区前缀推测
      if (timezone.startsWith("Europe/")) {
        return { country: "Europe", countryCode: "EU", detected: true };
      } else if (timezone.startsWith("Asia/")) {
        return { country: "Asia", countryCode: "AS", detected: true };
      } else if (timezone.startsWith("America/")) {
        return { country: "United States", countryCode: "US", detected: true };
      }
    } catch (error) {
      console.log("Timezone detection failed:", error);
    }

    return { country: "Unknown", countryCode: "US", detected: false };
  };

  // 通过网站 locale 推测位置（优先网站语言，备选浏览器语言）
  const detectFromLanguage = (): LocationInfo => {
    try {
      // 优先检查网站当前语言设置
      // console.log("网站当前语言:", currentLocale);
      // console.log("浏览器语言:", navigator.language);

      if (currentLocale === "ru") {
        return {
          country: "Russia",
          countryCode: "RU",
          detected: true,
        };
      }

      // 备选：检查浏览器语言
      const browserLocale = navigator.language || "";
      if (browserLocale.toLowerCase().startsWith("ru")) {
        return {
          country: "Russia",
          countryCode: "RU",
          detected: true,
        };
      }
    } catch (error) {
      console.log("Language detection failed:", error);
    }

    return { country: "Unknown", countryCode: "US", detected: false };
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
    isRussia: isRussia(),
    shouldUsePayssion: shouldUsePayssion(),
    refresh: detectLocation,
  };
}
