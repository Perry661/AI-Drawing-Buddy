type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || "unknown";
}

export function createInMemoryRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions) {
  const buckets = new Map<string, RateLimitEntry>();

  return {
    check(key: string): RateLimitResult {
      const currentTime = now();
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= currentTime) {
        buckets.set(key, { count: 1, resetAt: currentTime + windowMs });
        return { allowed: true };
      }

      if (existing.count >= limit) {
        return { allowed: false, retryAfterMs: existing.resetAt - currentTime };
      }

      existing.count += 1;
      return { allowed: true };
    },
  };
}

// Coarse MVP abuse protection only. This in-memory limiter is per server process,
// not distributed or globally consistent across deployments.
export const aiRateLimiter = createInMemoryRateLimiter({
  limit: 20,
  windowMs: 60_000,
});
