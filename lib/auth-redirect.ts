import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

const BLOCKED_PREFIXES = ["/login", "/signup", "/reset-password", "/api/auth"];

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_REDIRECT
): string {
  if (!path) return fallback;

  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  if (BLOCKED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return fallback;
  }

  return normalized;
}
