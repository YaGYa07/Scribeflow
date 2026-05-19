import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import { authConfig } from "@/config/auth.config";
import { authProviders } from "@/config/auth-providers";
import { AUTH_SESSION } from "@/lib/auth-session";
import { db } from "./db";
import { users } from "./db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: authProviders,
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION.MAX_AGE_SECONDS,
    updateAge: AUTH_SESSION.UPDATE_AGE_SECONDS,
  },
  events: {
    linkAccount: async ({ user }) => {
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id!));
    },
  },
});

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};
