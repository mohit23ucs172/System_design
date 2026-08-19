# Distributed Rate Limiter

A Redis-backed rate limiter using the token bucket algorithm, built as reusable Express middleware.

## Problem
Naive rate limiters using in-memory counters break in two ways:
1. They don't work across multiple server instances (each instance has its own counter).
2. Read-then-write logic causes race conditions under concurrent requests — two requests can both pass a check that should only allow one.

## Solution
- Token bucket algorithm: each client gets a bucket of tokens that refills gradually over time, allowing controlled bursts instead of a hard on/off limit.
- Redis Lua scripting: the check-and-deduct logic runs as a single atomic operation inside Redis, eliminating race conditions entirely — even under concurrent load from multiple server instances.

## Tech
Node.js, Express, Redis (ioredis), Lua

## How it works
1. Client sends a request.
2. Middleware calls a Lua script in Redis with the client's identifier (IP).
3. Script checks/refills/deducts tokens atomically, returns allow or block.
4. Blocked requests get `429 Too Many Requests`.

## Run locally
\`\`\`bash
docker run -d -p 6379:6379 redis
npm install
cp .env.example .env
npm run dev
\`\`\`

## Test
\`\`\`bash
for i in {1..8}; do curl http://localhost:4000/api/data; done
\`\`\`
First 5 requests succeed, remaining are rate-limited — proving the atomic token bucket under burst load.