import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { CredentialsSignin } from "next-auth";

import { authenticateWithCredentials } from "@/lib/auth-credentials";
import { env } from "@/lib/env";

class OAuthOnlySignIn extends CredentialsSignin {
  code = "oauth_only";
}

class InvalidCredentialsSignIn extends CredentialsSignin {
  code = "invalid_credentials";
}

export const authProviders = [
  GoogleProvider({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }),
  CredentialsProvider({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      type: { label: "Type", type: "text" },
      email: { label: "Email", type: "email" },
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const result = await authenticateWithCredentials(
        credentials as Record<string, string> | undefined
      );

      if (result.ok) return result.user;

      if (result.reason === "oauth_only") {
        throw new OAuthOnlySignIn();
      }

      throw new InvalidCredentialsSignIn();
    },
  }),
];
