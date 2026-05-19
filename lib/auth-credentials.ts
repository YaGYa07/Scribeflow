import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import { emailSchema, passwordSchema, usernameSchema } from "@/lib/validations";

export type CredentialAuthFailure =
  | "invalid"
  | "oauth_only"
  | "wrong_password";

export type CredentialAuthSuccess = {
  ok: true;
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
  };
};

export type CredentialAuthResult =
  | CredentialAuthSuccess
  | { ok: false; reason: CredentialAuthFailure };

function parseLoginCredentials(credentials: Record<string, string> | undefined) {
  if (!credentials?.password) return null;

  const password = credentials.password;
  const type = credentials.type === "username" ? "username" : "email";

  if (type === "username") {
    const username = credentials.username?.trim();
    if (!username) return null;

    const parsed = usernameSchema.safeParse(username);
    const passwordParsed = passwordSchema.safeParse(password);
    if (!parsed.success || !passwordParsed.success) return null;

    return { type: "username" as const, username: parsed.data, password };
  }

  const email = credentials.email?.trim().toLowerCase();
  if (!email) return null;

  const emailParsed = emailSchema.safeParse(email);
  const passwordParsed = passwordSchema.safeParse(password);
  if (!emailParsed.success || !passwordParsed.success) return null;

  return { type: "email" as const, email: emailParsed.data, password };
}

export async function authenticateWithCredentials(
  credentials: Record<string, string> | undefined
): Promise<CredentialAuthResult> {
  const login = parseLoginCredentials(credentials);
  if (!login) return { ok: false, reason: "invalid" };

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) =>
      login.type === "email" ?
        eq(u.email, login.email)
      : eq(u.username, login.username),
  });

  if (!dbUser) return { ok: false, reason: "invalid" };

  if (!dbUser.password) {
    return { ok: false, reason: "oauth_only" };
  }

  const isValid = await compare(login.password, dbUser.password);
  if (!isValid) return { ok: false, reason: "wrong_password" };

  return {
    ok: true,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      username: dbUser.username,
    },
  };
}
