const TICKER_REGEX = /^[A-Z0-9]([A-Z0-9\-\.]{0,19})$/i;

export function validateTicker(ticker: unknown): ticker is string {
  return typeof ticker === "string" && ticker.length > 0 && ticker.length <= 20 && TICKER_REGEX.test(ticker);
}

export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).replace(/[<>]/g, "");
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}
