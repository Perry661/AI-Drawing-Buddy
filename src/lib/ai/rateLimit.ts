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

function sanitizeIpCandidate(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) {
    return undefined;
  }
  return /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : undefined;
}

export function getClientIp(headers: Headers) {
  // Coarse MVP key extraction. Prefer platform-provided client IP headers when present;
  // x-forwarded-for remains spoofable unless set by trusted infrastructure.
  const platformIp = sanitizeIpCandidate(headers.get("x-real-ip") ?? undefined);
  if (platformIp) {
    return platformIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  return sanitizeIpCandidate(forwardedFor?.split(",")[0]) ?? "unknown";
}

export function createInMemoryRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions) {
  const buckets = new Map<string, RateLimitEntry>();

  return {
    getBucketCount() {
      return buckets.size;
    },

    check(key: string): RateLimitResult {
      const currentTime = now();
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= currentTime) {
          buckets.delete(bucketKey);
        }
      }

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
