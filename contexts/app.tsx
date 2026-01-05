"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
// import { cacheRemove } from "@/lib/cache";
// import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import useMembership from "@/hooks/useMembership";
import useCredits from "@/hooks/useCredits";
import { useSession } from "next-auth/react";
import { Pricing } from "@/types/blocks/pricing";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { locales } from "@/i18n/locale";

const PricingModal = dynamic(
  () => import("@/components/blocks/pricing/pricing-modal"),
  { ssr: false }
);

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({
  children,
  locale,
}: {
  children: ReactNode;
  locale?: string;
}) => {
  const pathname = usePathname() || "/";
  const normalizedPathname = (() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "/";

    const maybeLocale = segments[0];
    if (locales.includes(maybeLocale as (typeof locales)[number])) {
      return `/${segments.slice(1).join("/")}` || "/";
    }

    return pathname;
  })();

  const oneTapRouteEnabled =
    normalizedPathname === "/" ||
    normalizedPathname.startsWith("/ai-shorts") ||
    normalizedPathname.startsWith("/history") ||
    normalizedPathname.startsWith("/home") ||
    normalizedPathname.startsWith("/image-to-image") ||
    normalizedPathname.startsWith("/image-to-video") ||
    normalizedPathname.startsWith("/nano-banana-pro") ||
    normalizedPathname.startsWith("/reference-to-video") ||
    normalizedPathname.startsWith("/text-to-image") ||
    normalizedPathname.startsWith("/text-to-video") ||
    normalizedPathname.startsWith("/video-effects");

  useOneTapLogin({
    resetKey: normalizedPathname,
    enabled:
      oneTapRouteEnabled &&
      process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
      !!process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
  });

  const { data: session } = useSession();
  const { membership, isLoadingMembership, refreshMembership } =
    useMembership();
  const { leftCredits, updateLeftCredits } = useCredits();

  const [theme, setTheme] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_DEFAULT_THEME || "";
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [pricingData, setPricingData] = useState<Pricing | null>(null);

  // 添加调研横幅状态
  const [surveyBannerVisible, setSurveyBannerVisible] = useState<boolean>(true);

  const fetchUserInfo = async function () {
    try {
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      // updateInvite(data);
      updateLeftCredits();

      // 获取会员状态（只在用户信息获取成功后获取一次）
      if (data?.uuid) {
        refreshMembership();
      }
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

  // 邀请功能已禁用以防止薅羊毛行为
  // const updateInvite = async (_user: User) => {
  //   try {
  //     console.log("Invite feature disabled, skipping invite update");
  //     // 清理可能存在的邀请码缓存
  //     cacheRemove(CacheKey.InviteCode);
  //     return;
  //   } catch (e) {
  //     console.log("update invite cleanup failed: ", e);
  //   }
  // };

  /* 
  已注释的原始邀请处理逻辑：
  
  const updateInvite = async (user: User) => {
    try {
      if (user.invited_by) {
        // user already been invited
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // no invite code
        return;
      }

      const userCreatedAt = moment(user.created_at).unix();
      const currentTime = moment().unix();
      const timeDiff = Number(currentTime - userCreatedAt);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // user created more than 2 hours
        console.log("user created more than 2 hours");
        return;
      }

      // update invite relation
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  };
  */

  useEffect(() => {
    if (session && session.user) {
      fetchUserInfo();
    }
  }, [session]);

  useEffect(() => {
    if (!showPricingModal || pricingData) {
      return;
    }

    let cancelled = false;

    const fetchPricingData = async () => {
      try {
        const { getPricingBlock } = await import("@/services/page");
        const data = await getPricingBlock(locale || "en");
        if (!cancelled) {
          setPricingData(data);
        }
      } catch (error) {
        console.error("Failed to fetch pricing data:", error);
      }
    };

    fetchPricingData();

    return () => {
      cancelled = true;
    };
  }, [showPricingModal, pricingData, locale]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        showPricingModal,
        setShowPricingModal,
        user,
        setUser,
        membership,
        isLoadingMembership,
        refreshMembership,
        surveyBannerVisible,
        setSurveyBannerVisible,
        leftCredits,
        updateLeftCredits,
      }}
    >
      {children}
      {/* Global Pricing Modal */}
      {pricingData && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          pricing={pricingData}
        />
      )}
    </AppContext.Provider>
  );
};
