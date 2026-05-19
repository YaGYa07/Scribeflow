import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import NextAuth from "next-auth";

import { authConfig } from "./config/auth.config";
import { authRoutes, publicRoutes } from "./config/routes";
import { getSafeRedirectPath } from "./lib/auth-redirect";
import { env } from "./lib/env";

const { auth } = NextAuth(authConfig);

function getRatelimit() {
  if (
    env.ENABLE_RATE_LIMITING !== "true" ||
    !env.UPSTASH_REDIS_REST_URL ||
    !env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      env.RATE_LIMITING_REQUESTS_PER_SECOND,
      "1s"
    ),
  });
}

export default auth(async (req) => {
  const ratelimit = getRatelimit();

  if (ratelimit && env.NODE_ENV === "production") {
    const id = getIP(req) || "anonymous";
    const { limit, pending, remaining, reset, success } =
      await ratelimit.limit(id);

    if (!success) {
      return NextResponse.json(
        {
          error: {
            message: "Too many requests",
            limit,
            pending,
            remaining,
            reset: `${reset - Date.now()}ms`,
          },
        },
        {
          status: 429,
          headers: {
            "x-ratelimit-limit": limit.toString(),
            "x-ratelimit-remaining": remaining.toString(),
          },
        }
      );
    }
  }

  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith("/api/health");

  if (isAuthRoute) {
    if (isLoggedIn) {
      const destination = getSafeRedirectPath(nextUrl.searchParams.get("from"));
      return NextResponse.redirect(new URL(destination, nextUrl));
    }

    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    let from = nextUrl.pathname;
    if (nextUrl.search) {
      from += nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next|api/auth).*)"],
};

type RequestWithHeaders = {
  headers: Headers;
  ip?: string;
};

function getIP(req: RequestWithHeaders): string {
  const ipFromReq = "ip" in req ? req.ip : undefined;
  let ip = ipFromReq ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }
  return ip ?? "";
}
