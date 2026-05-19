#!/usr/bin/env node
/**
 * Node-based load test (no k6 required). Reports p50/p95/p99, mean, std dev.
 *
 * Usage:
 *   node benchmarks/run-load-test.mjs --url http://localhost:3000 --rps 100 --duration 60
 *   node benchmarks/run-load-test.mjs --compare
 */

import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const COMPARE = args.includes("--compare");
const RPS = Number(getArg("--rps", "100"));
const DURATION_SEC = Number(getArg("--duration", "60"));
const PATH = getArg("--path", "/");

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = n ? sorted.reduce((a, b) => a + b, 0) / n : 0;
  const variance =
    n > 1 ?
      sorted.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1)
    : 0;
  return {
    n,
    mean_ms: Math.round(mean),
    stddev_ms: Math.round(Math.sqrt(variance)),
    p50_ms: Math.round(percentile(sorted, 50)),
    p95_ms: Math.round(percentile(sorted, 95)),
    p99_ms: Math.round(percentile(sorted, 99)),
    min_ms: Math.round(sorted[0] ?? 0),
    max_ms: Math.round(sorted[n - 1] ?? 0),
  };
}

async function runLoadTest(label, baseUrl) {
  const url = `${baseUrl.replace(/\/$/, "")}${PATH}`;
  const latencies = [];
  let errors = 0;
  const intervalMs = 1000 / RPS;
  const endAt = performance.now() + DURATION_SEC * 1000;

  console.log(`\n[${label}] ${url} @ ${RPS} RPS for ${DURATION_SEC}s`);

  const workers = [];
  while (performance.now() < endAt) {
    const tickStart = performance.now();
    workers.push(
      (async () => {
        const t0 = performance.now();
        try {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(15000),
          });
          const ms = performance.now() - t0;
          latencies.push(ms);
          if (!res.ok) errors += 1;
        } catch {
          errors += 1;
          latencies.push(performance.now() - t0);
        }
      })()
    );

    const elapsed = performance.now() - tickStart;
    const wait = Math.max(0, intervalMs - elapsed);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }

  await Promise.all(workers);

  const result = {
    label,
    url,
    target_rps: RPS,
    duration_sec: DURATION_SEC,
    errors,
    error_rate: latencies.length ? (errors / latencies.length).toFixed(4) : "0",
    ...stats(latencies),
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const targets = COMPARE
    ? [
        ["ScribeFlow", getArg("--scribeflow", "http://localhost:3000")],
        ["Reference (Next.js)", getArg("--reference", "http://localhost:3001")],
      ]
    : [["ScribeFlow", getArg("--url", "http://localhost:3000")]];

  const results = [];
  for (const [label, url] of targets) {
    try {
      results.push(await runLoadTest(label, url));
    } catch (e) {
      console.error(`Failed ${label}:`, e.message);
    }
  }

  await mkdir("benchmarks/results", { recursive: true });
  const out = `benchmarks/results/load-rps${RPS}-${Date.now()}.json`;
  await writeFile(out, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2));
  console.log(`\nWrote ${out}`);
}

main();
