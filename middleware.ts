import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

const API_AUTH_PATHS = [
  "/api/admin",
  "/api/consultants",
  "/api/tasks",
  "/api/me",
];

function isApiAuthPath(pathname: string): boolean {
  return API_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Upstash tanımlıysa global API rate limit (100 istek/dakika/IP). Yoksa devre dışı. */
function getApiRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "apply2campus:api",
  });
}

let apiRateLimiter: Ratelimit | null | undefined = undefined;

export default withAuth(
  async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Global API rate limit (DDoS azaltma) – sadece Upstash tanımlıysa
    if (pathname.startsWith("/api/")) {
      if (apiRateLimiter === undefined) apiRateLimiter = getApiRateLimiter();
      if (apiRateLimiter) {
        const ip = getClientIp(req);
        const { success } = await apiRateLimiter.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin." },
            { status: 429 }
          );
        }
      }
    }

    if (isApiAuthPath(pathname)) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
      });
      if (!token) {
        return NextResponse.json({ error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." }, { status: 401 });
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        if (pathname.startsWith("/api")) return true;
        if (isApiAuthPath(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/students/:path*",
    "/operasyon/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/:path*",
    "/api/badges",
    "/api/students/:path*",
    "/api/students/:studentId/emails/:path*",
    "/api/students/:studentId/send",
    "/api/students/:studentId/disconnect",
    "/api/students/:studentId/sync",
    "/api/operasyon/:path*",
    "/api/oauth/gmail/start",
    "/api/admin/:path*",
    "/api/consultants/:path*",
    "/api/tasks",
    "/api/tasks/:path*",
    "/api/me/:path*",
  ],
};
