# Benchmark results (laboratory, localhost)

**Client:** macOS development machine, loopback (`127.0.0.1`).  
**Tool:** `benchmarks/run-load-test.mjs` (constant-arrival-rate; same workload as `benchmarks/k6/load.js`).  
**ScribeFlow:** `bun run build && PORT=3000 bun run start`.  
**Reference:** minimal Next.js app in `benchmarks/reference-stack/` on port 3001.

> For thesis submission against a remote Supabase (Frankfurt) + Vercel deployment, re-run with  
> `BASE_URL=https://your-app.vercel.app` after deploy. Do **not** report loopback RTT as India→Frankfurt DB RTT.

## Table A — ScribeFlow home page (`GET /`)

| Target RPS | Duration | p50 (ms) | p95 (ms) | p99 (ms) | Mean (ms) | Std dev (ms) | Error rate |
|------------|----------|----------|----------|----------|-----------|--------------|------------|
| 80 | 45 s | 5 | 6 | 23 | 5 | 4 | 0.00% |
| 100 | 30 s | 5 | 5 | 8 | 5 | 3 | 0.00% |
| 200 | 30 s | 4 | 5 | 9 | 4 | 5 | 0.00% |
| 500 | 20 s | 68 | 8028 | 8031 | 2510 | 3420 | 24.38% |

At 500 RPS the local Node process became CPU-saturated; this documents an upper bound on the **development** host, not cloud autoscaling.

## Table B — Reference comparison @ 80 RPS (45 s)

| Stack | p50 (ms) | p95 (ms) | p99 (ms) | Mean (ms) | Std dev (ms) | Error rate |
|-------|----------|----------|----------|-----------|--------------|------------|
| ScribeFlow (Drizzle, middleware, lobby page) | 5 | 6 | 23 | 5 | 4 | 0.00% |
| Reference Next.js (static home only) | 2 | 3 | 4 | 2 | 1 | 0.00% |

The reference stack isolates framework overhead; ScribeFlow adds authentication middleware and a richer landing page. Production comparison should use equivalent routes (e.g. both `GET /`).

## Reproduce

```bash
bun install
SKIP_ENV_VALIDATION=true bun run build && PORT=3000 bun run start &
cd benchmarks/reference-stack && bun install && bun run build && PORT=3001 bun run start &
node benchmarks/run-load-test.mjs --compare --rps 80 --duration 45
```
