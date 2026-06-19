import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    division?: string | null;
    hasOnboarded?: boolean;
    isApproved?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      division: string | null;
      hasOnboarded: boolean;
      isApproved: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    division?: string | null;
    hasOnboarded?: boolean;
    isApproved?: boolean;
  }
}
