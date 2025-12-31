import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    "/api/payments/initialize",
    "/api/payments/verify",
    "/api/cleanup",
    "/api/public/tickets/:path*/reserve",
  ],
};

export default async function middleware(req: NextRequest) {
  // Get IP
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        }
      }
    );
  }

  const res = NextResponse.next();
  
  // Add rate limit info to response headers (optional but good practice)
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());

  return res;
}
