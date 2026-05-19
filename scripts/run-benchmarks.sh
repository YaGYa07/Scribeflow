#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Building ScribeFlow ==="
SKIP_ENV_VALIDATION=true bun run build

echo "=== Building reference stack ==="
cd benchmarks/reference-stack
bun install
bun run build
cd ../..

echo "=== Starting servers ==="
SKIP_ENV_VALIDATION=true bun run start --port 3000 &
PID_MAIN=$!
cd benchmarks/reference-stack && bun run start &
PID_REF=$!
cd ../..

sleep 8

echo "=== Warm-up ==="
curl -sf http://localhost:3000/ >/dev/null || true
curl -sf http://localhost:3001/ >/dev/null || true

echo "=== Load tests (100 RPS, 60s) ==="
node benchmarks/run-load-test.mjs --compare --rps 100 --duration 60
node benchmarks/generate-paper-results.mjs

kill $PID_MAIN $PID_REF 2>/dev/null || true
echo "Done. See docs/BENCHMARK_RESULTS.md"
