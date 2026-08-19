const redis = require('../config/redis');

// Lua script — runs atomically inside Redis, no race conditions
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'timestamp')
local tokens = tonumber(bucket[1])
local timestamp = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  timestamp = now
end

local elapsed = now - timestamp
local refill = elapsed * refill_rate
tokens = math.min(capacity, tokens + refill)

if tokens < 1 then
  redis.call('HMSET', key, 'tokens', tokens, 'timestamp', now)
  redis.call('EXPIRE', key, 60)
  return 0
else
  tokens = tokens - 1
  redis.call('HMSET', key, 'tokens', tokens, 'timestamp', now)
  redis.call('EXPIRE', key, 60)
  return 1
end
`;

async function checkRateLimit(identifier, capacity = 10, refillRate = 1) {
  const now = Date.now() / 1000;
  const key = `rate_limit:${identifier}`;

  const allowed = await redis.eval(
    TOKEN_BUCKET_SCRIPT,
    1,
    key,
    capacity,
    refillRate,
    now
  );

  return allowed === 1;
}

function rateLimiter(options = {}) {
  const capacity = options.capacity || 10;
  const refillRate = options.refillRate || 1;

  return async (req, res, next) => {
    const identifier = req.ip;
    const allowed = await checkRateLimit(identifier, capacity, refillRate);

    if (!allowed) {
      return res.status(429).json({ error: 'Too many requests. Slow down.' });
    }
    next();
  };
}



module.exports = rateLimiter;

// Add this Lua script above module.exports, after TOKEN_BUCKET_SCRIPT
const PEEK_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'timestamp')
local tokens = tonumber(bucket[1])
local timestamp = tonumber(bucket[2])

if tokens == nil then
  return capacity
end

local elapsed = now - timestamp
local refill = elapsed * refill_rate
tokens = math.min(capacity, tokens + refill)

return tokens
`;

async function peekBucket(identifier, capacity = 5, refillRate = 0.5) {
  const now = Date.now() / 1000;
  const key = `rate_limit:${identifier}`;

  const tokens = await redis.eval(PEEK_SCRIPT, 1, key, capacity, refillRate, now);
  return { tokens: Math.floor(tokens * 100) / 100, capacity };
}

// Update module.exports at the bottom of the file to:
module.exports = { rateLimiter, peekBucket };