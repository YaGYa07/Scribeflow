# ScribeFlow performance benchmarks

Supervisor feedback requires **100–500 RPS** load tests with **p50 / p95 / p99** latencies and standard deviations—not “10 concurrent users.”

## Prerequisites

```bash
brew install k6   # macOS
# or: https://grafana.com/docs/k6/latest/set-up/install-k6/
```

Deploy or run locally:

```bash
bun run build && bun run start
```

## 1. Smoke test (sanity)

```bash
BASE_URL=http://localhost:3000 k6 run benchmarks/k6/smoke.js
```

## 2. Load test (report these numbers in the paper)

```bash
mkdir -p benchmarks/results

# 100 RPS × 3 minutes
BASE_URL=https://YOUR_DEPLOYMENT TARGET_RPS=100 DURATION=3m \
  k6 run benchmarks/k6/load.js

# Repeat for 200 and 500 RPS (use a machine in the same region as production)
TARGET_RPS=200 DURATION=3m k6 run benchmarks/k6/load.js
TARGET_RPS=500 DURATION=3m k6 run benchmarks/k6/load.js
```

From the k6 summary, copy into **Table I (revised)**:

| Metric | Source in k6 output |
|--------|---------------------|
| p50 | `http_req_duration` → `p(50)` |
| p95 | `p(95)` |
| p99 | `p(99)` |
| Mean | `avg` |
| Std dev | export JSON and compute, or use Grafana |

## 3. Network / RTT (fix the “12 ms to Frankfurt” issue)

```bash
chmod +x benchmarks/scripts/measure-rtt.sh
./benchmarks/scripts/measure-rtt.sh https://YOUR_DEPLOYMENT
DATABASE_HOST=db.YOUR_PROJECT.supabase.co ./benchmarks/scripts/measure-rtt.sh https://YOUR_DEPLOYMENT
```

Report **separately**:

- Client → **Vercel edge** (often low ms if edge is nearby)
- Client → **Supabase** (India → Frankfurt is typically **130 ms+** one-way minimum)

## 4. Authenticated workload (optional)

Log in in the browser, copy the session cookie, then:

```bash
K6_SESSION_COOKIE='next-auth.session-token=...' TARGET_RPS=50 k6 run benchmarks/k6/smoke.js
```

Extend `load.js` with dashboard routes once a stable test user exists.

## 5. Reference stack comparison (supervisor request)

Run the **same** k6 scripts against a minimal **Next.js + Prisma** app with equivalent routes, or cite published benchmarks and explain differences in methodology.

Scripts used in this repo: `benchmarks/k6/smoke.js`, `benchmarks/k6/load.js`, `benchmarks/k6/config.js`.
