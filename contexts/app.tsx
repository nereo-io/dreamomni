"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import useMembership from "@/hooks/useMembership";
import { useSession } from "next-auth/react";
import { ChatSession } from "@/types/chat";
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

  const [theme, setTheme] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_DEFAULT_THEME || "";
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [chat, setChat] = useState<ChatSession | null>(null);

  useEffect(() => {
    if (session && session.user) {
      setUser(session.user);
    }
  }, [session]);

  // 当用户登录状态改变时，刷新会员状态
  useEffect(() => {
    if (user?.uuid) {
      refreshMembership();
    }
  }, [user?.uuid]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user,
        setUser,
        membership,
        isLoadingMembership,
        refreshMembership,
        chat,
        setChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
