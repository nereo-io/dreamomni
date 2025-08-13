"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import moment from "moment";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import useMembership from "@/hooks/useMembership";
import useCredits from "@/hooks/useCredits";
import { useSession } from "next-auth/react";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import PricingModal from "@/components/blocks/pricing/pricing-modal";
import { getPricingBlock } from "@/services/page";
import { Pricing } from "@/types/blocks/pricing";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  ) {
    useOneTapLogin();
  }

  const { data: session } = useSession();
  const { membership, isLoadingMembership, refreshMembership } =
    useMembership();
  const { leftCredits, updateLeftCredits } = useCredits();
  const { trackSignup } = useYandexTracking();

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
      
      // 检测并追踪新用户注册
      if (data && data.created_at && session) {
        const userCreatedTime = moment(data.created_at);
        const now = moment();
        const minutesSinceCreation = now.diff(userCreatedTime, 'minutes');
        
        // 如果用户是在最近5分钟内创建的，视为新用户
        if (minutesSinceCreation <= 5) {
          const trackedUsersKey = 'yandex_tracked_users';
          const trackedUsers = localStorage.getItem(trackedUsersKey);
          const trackedUsersList = trackedUsers ? JSON.parse(trackedUsers) : [];
          
          // 检查是否已经追踪过该用户
          if (!trackedUsersList.includes(data.uuid)) {
            // 判断登录方式
            let loginMethod = 'unknown';
            if (data.signin_provider) {
              loginMethod = data.signin_provider;
            } else if (session.user?.email === data.email) {
              // 如果没有 provider 信息但邮箱匹配，可能是邮箱注册
              loginMethod = 'email';
            }
            
            // 追踪新用户注册
            trackSignup(loginMethod, data.uuid);
            
            // 记录已追踪的用户
            trackedUsersList.push(data.uuid);
            localStorage.setItem(trackedUsersKey, JSON.stringify(trackedUsersList));
          }
        }
      }
      
      updateInvite(data);
      updateLeftCredits();
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

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

  useEffect(() => {
    if (session && session.user) {
      fetchUserInfo();
    }
  }, [session]);

  // 当用户登录状态改变时，刷新会员状态
  useEffect(() => {
    if (user?.uuid) {
      refreshMembership();
    }
  }, [user?.uuid]);

  // 获取 pricing 数据
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const data = await getPricingBlock("en");
        setPricingData(data);
      } catch (error) {
        console.error("Failed to fetch pricing data:", error);
      }
    };

    fetchPricingData();
  }, []);

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
