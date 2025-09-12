import "next-auth";

declare module "next-auth" {
  interface JWT {
    user?: {
      uuid?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
      provider?: string;
    };
    isNewUser?: boolean;
  }

  interface Session {
    user: {
      uuid?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
      provider?: string;
    } & DefaultSession["user"];
    isNewUser?: boolean;
  }
}
