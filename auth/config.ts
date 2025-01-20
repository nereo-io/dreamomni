import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { User } from "@/types/user";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";
import { saveUser } from "@/services/user";

let providers: Provider[] = [];

// Google One Tap Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",

      credentials: {
        credential: { type: "text" },
      },

      async authorize(credentials, req) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        if (!googleClientId) {
          console.log("invalid google auth config");
          return null;
        }

        const token = credentials!.credential;

        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
        );
        if (!response.ok) {
          console.log("Failed to verify token");
          return null;
        }

        const payload = await response.json();
        if (!payload) {
          console.log("invalid payload from token");
          return null;
        }

        const {
          email,
          sub,
          given_name,
          family_name,
          email_verified,
          picture: image,
        } = payload;
        if (!email) {
          console.log("invalid email in payload");
          return null;
        }

        const user = {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };

        return user;
      },
    })
  );
}

// Google Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Github Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" &&
  process.env.AUTH_GITHUB_ID &&
  process.env.AUTH_GITHUB_SECRET
) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

// Apple Auth
if (
  process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === "true" &&
  process.env.AUTH_APPLE_ID &&
  process.env.AUTH_APPLE_SECRET
) {
  providers.push(
    AppleProvider({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
      authorization: {
        params: {
          scope: "name email",
          response_mode: "form_post",
          response_type: "code",
        },
      },
      profile(profile) {
        console.log("[Apple Auth] Raw profile:", profile);
        
        let name = "Apple User";
        // 处理名字
        if (profile.name) {
          const parts = [];
          if (profile.name.firstName) parts.push(profile.name.firstName);
          if (profile.name.lastName) parts.push(profile.name.lastName);
          if (parts.length > 0) {
            name = parts.join(" ");
          }
        }
        // 如果没有名字，使用邮箱前缀
        if (name === "Apple User" && profile.email) {
          name = profile.email.split("@")[0];
        }

        return {
          id: profile.sub,
          name: name,
          email: profile.email,
          image: null,
        }
      },
    })
  );
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "google-one-tap");

export const authOptions: NextAuthConfig = {
  providers,
  debug: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("[NextAuth] Sign in attempt:", {
        user,
        account,
        profile,
        email,
        credentials,
      });
      
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async redirect({ url, baseUrl }) {
      console.log("[NextAuth] Redirect attempt:", { url, baseUrl });
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token, user }) {
      console.log("[NextAuth] Session callback:", { session, token, user });
      if (token && token.user && token.user) {
        session.user = token.user;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log("[NextAuth] JWT callback:", { token, user, account });
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user && user.email && account) {
        const dbUser: User = {
          uuid: getUuid(),
          email: user.email,
          nickname: user.name || "",
          avatar_url: user.image || "",
          signin_type: account.type,
          signin_provider: account.provider,
          signin_openid: account.providerAccountId,
          created_at: getIsoTimestr(),
          signin_ip: await getClientIp(),
        };

        try {
          const savedUser = await saveUser(dbUser);

          token.user = {
            uuid: savedUser.uuid,
            email: savedUser.email,
            nickname: savedUser.nickname,
            avatar_url: savedUser.avatar_url,
            created_at: savedUser.created_at,
          };
        } catch (e) {
          console.error("[NextAuth] Save user failed:", e);
        }
      }
      return token;
    },
  },
};
