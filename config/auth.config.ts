import type { NextAuthConfig } from "next-auth";

import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

/**
 * Edge-safe Auth.js config for middleware.
 * Must not import the database, bcrypt, or credential authorize logic.
 */
export const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username =
          (user as { username?: string | null }).username ?? token.username;
      }

      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.username = token.username ?? null;
      }

      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${getSafeRedirectPath(url)}`;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return `${baseUrl}${getSafeRedirectPath(parsed.pathname + parsed.search)}`;
        }
      } catch {
        /* ignore malformed URLs */
      }

      return `${baseUrl}${DEFAULT_LOGIN_REDIRECT}`;
    },
  },
} satisfies NextAuthConfig;
