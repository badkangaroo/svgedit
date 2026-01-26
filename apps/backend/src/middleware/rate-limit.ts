import type { FastifyReply, FastifyRequest } from "fastify";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitConfig = {
  windowMs: number;
  max: number;
  key: (request: FastifyRequest) => string;
};

export const createRateLimiter = (config: RateLimitConfig) => {
  const buckets = new Map<string, RateLimitRecord>();

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const now = Date.now();
    const key = config.key(request);
    const record = buckets.get(key);

    if (!record || record.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + config.windowMs });
      return;
    }

    record.count += 1;

    if (record.count > config.max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      reply
        .status(429)
        .header("Retry-After", retryAfterSeconds)
        .send({
          code: "RATE_LIMITED",
          message: "Too many requests",
          requestId: request.id,
        });
      return;
    }

    buckets.set(key, record);
  };
};
