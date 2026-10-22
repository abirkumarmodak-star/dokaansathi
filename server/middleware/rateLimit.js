"use strict";

// Optional positive integer settings: LOGIN_RATE_LIMIT_WINDOW_MS / LOGIN_RATE_LIMIT_MAX,
// TRACKING_RATE_LIMIT_WINDOW_MS / TRACKING_RATE_LIMIT_MAX, and
// CANCEL_RATE_LIMIT_WINDOW_MS / CANCEL_RATE_LIMIT_MAX. Defaults are conservative.

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createRateLimiter({ name, windowEnv, maxEnv, defaultWindowMs = 60_000, defaultMax = 10, now = Date.now } = {}) {
    const windowMs = positiveInteger(process.env[windowEnv], defaultWindowMs);
    const max = positiveInteger(process.env[maxEnv], defaultMax);
    const buckets = new Map();

    return function rateLimiter(req, res, next) {
        // req.ip honors only the proxy chain Express has been explicitly told to trust.
        // Counters are process-local; multiple instances need a shared limiter for global limits.
        const ip = typeof req.ip === "string" && req.ip ? req.ip : "unknown";
        const key = `${name || "request"}:${ip}`;
        const current = now();
        let bucket = buckets.get(key);

        if (!bucket || current - bucket.startedAt >= windowMs) {
            bucket = { startedAt: current, count: 0 };
            buckets.set(key, bucket);
        }

        bucket.count += 1;
        if (bucket.count > max) {
            return res.status(429).json({
                success: false,
                message: "Too many requests. Try again later."
            });
        }

        if (buckets.size > 10_000) {
            for (const [bucketKey, entry] of buckets) {
                if (current - entry.startedAt >= windowMs) buckets.delete(bucketKey);
            }
        }

        return next();
    };
}

module.exports = { createRateLimiter };
