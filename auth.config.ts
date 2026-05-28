import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — no Node.js-only imports (no Prisma, no bcrypt)
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // actual providers defined in auth.ts (Node.js only)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.division = (user as { division?: string | null }).division;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.division = token.division as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
