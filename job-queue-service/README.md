# Job Queue Service

A background job processing system using BullMQ (Redis-backed), demonstrating the producer/consumer pattern used in real production systems for handling slow operations without blocking API responses.

## Problem
Handling slow operations (sending emails, processing images, generating PDFs) directly inside an API request handler makes users wait unnecessarily, and a single slow task can block the server from handling other requests.

## Solution
- **Separation of concerns**: the API server only queues jobs; a separate worker process handles execution.
- **Retries with exponential backoff**: failed jobs (e.g. a flaky email service) automatically retry with increasing delays, instead of hammering a struggling downstream service.
- **Concurrency control**: the worker processes multiple jobs in parallel, configurable independently from the API server's load.
- **Bull Board dashboard**: real-time visibility into job status (waiting/active/completed/failed) — the same tooling used in production BullMQ deployments.

## Tech
Node.js, Express, BullMQ, Redis, Bull Board

## Architecture

## Run locally
```bash
docker run -d -p 6379:6379 redis
npm install
cp .env.example .env

# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:worker
```

Visit `http://localhost:4001` for the signup form, `http://localhost:4001/admin/queues` for the live job dashboard.

## Test
```bash
curl -X POST http://localhost:4001/api/signup -H "Content-Type: application/json" -d '{"email":"test@example.com","name":"Test"}'
```
Response returns in milliseconds while the actual "email send" (simulated 2s delay, 30% failure rate to demonstrate retries) happens asynchronously — visible live in the dashboard.