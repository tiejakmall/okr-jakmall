import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ["state"],
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          division: user.division,
          hasOnboarded: user.hasOnboarded,
          isApproved: user.isApproved,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Credentials sign-in
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = user.role;
        token.division = user.division;
        token.hasOnboarded = user.hasOnboarded ?? true;
        token.isApproved = user.isApproved ?? true;
      }

      // Google sign-in: find or create user in our DB
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          if (!dbUser.image && user.image) {
            await prisma.user.update({ where: { id: dbUser.id }, data: { image: user.image } });
          }
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.division = dbUser.division;
          token.hasOnboarded = dbUser.hasOnboarded;
          token.isApproved = dbUser.isApproved;
        } else {
          const newUser = await prisma.user.create({
            data: {
              name: user.name ?? "Pengguna Baru",
              email: user.email,
              image: user.image ?? null,
              hasOnboarded: false,
              isApproved: true,
            },
          });
          token.id = newUser.id;
          token.role = newUser.role;
          token.division = null;
          token.hasOnboarded = false;
          token.isApproved = true;
        }
      }

      // Refresh from DB when session.update() is called
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.division = dbUser.division;
          token.hasOnboarded = dbUser.hasOnboarded;
          token.isApproved = dbUser.isApproved;
        }
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.division = token.division as string | null;
      session.user.hasOnboarded = (token.hasOnboarded as boolean) ?? true;
      session.user.isApproved = (token.isApproved as boolean) ?? true;
      return session;
    },
  },
});
