import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
// import VkProvider from "next-auth/providers/vk";  // 使用SDK方案，不再使用OAuth Provider
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { User } from "@/types/user";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";
import { getUuid } from "@/lib/hash";
import { saveUser } from "@/services/user";
import { getDefaultAvatar } from "@/lib/avatar";
import { signInWithEmail } from "@/services/supabase-auth";

let providers: Provider[] = [];

// Email/Password Auth with Supabase
if (process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "true") {
  providers.push(
    CredentialsProvider({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await signInWithEmail(
            credentials.email as string,
            credentials.password as string
          );

          return user;
        } catch (error: any) {
          console.error("Email auth error:", error);

          // NextAuth 5.0 要求在错误时返回null，而不是抛出错误
          // 错误消息需要通过其他方式传递
          return null;
        }
      },
    })
  );
}

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

      async authorize(credentials) {
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

// VK Auth - 使用SDK方案，暂时禁用OAuth Provider
// SDK集成在 /components/sign/vk-login.tsx 和 /app/api/auth/vk-sdk/
// if (
//   process.env.NEXT_PUBLIC_AUTH_VK_ENABLED === "true" &&
//   process.env.AUTH_VK_ID &&
//   process.env.AUTH_VK_SECRET
// ) {
//   providers.push(
//     VkProvider({
//       clientId: process.env.AUTH_VK_ID,
//       clientSecret: process.env.AUTH_VK_SECRET,
//       checks: ["state"], // VK doesn't support PKCE
//     })
//   );
// }

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
        // console.log("[Apple Auth] Raw profile:", profile);

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
        };
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
  .filter(
    (provider) => provider.id !== "google-one-tap" && provider.id !== "email"
  );

export const authOptions: NextAuthConfig = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn() {
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token && token.user && token.user) {
        session.user = token.user;
      }
      // 传递新用户标志到 session
      if (typeof token.isNewUser === 'boolean') {
        session.isNewUser = token.isNewUser;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      try {
        if (user && user.email && account) {
          const dbUser: User = {
            uuid: getUuid(),
            email: user.email,
            nickname: user.name || user.email.split("@")[0] || "",
            avatar_url: user.image || getDefaultAvatar(user.email),
            signin_type: account.type,
            signin_provider: account.provider,
            signin_openid:
              account.provider === "email"
                ? user.id
                : account.providerAccountId,
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
              provider: account.provider,
            };
            
            // 保存新用户标志到 token
            token.isNewUser = savedUser.isNewUser;
          } catch (e) {
            console.error("save user failed:", e);
          }
        }
        return token;
      } catch (e) {
        console.error("jwt callback error:", e);
        return token;
      }
    },
  },
};
