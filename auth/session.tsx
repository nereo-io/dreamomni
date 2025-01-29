"use client";

import { SessionProvider } from "next-auth/react";

export function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={30 * 60}
    >
      {children}
    </SessionProvider>
  );
}
