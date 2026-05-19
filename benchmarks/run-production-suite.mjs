#!/usr/bin/env node
/**
 * Production benchmark suite: tries live URL, falls back to production build on localhost.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

const CANDIDATE_URLS = [
  process.env.BASE_URL,
  "https://scribeflow.app",
  "https://www.scribeflow.app",
].filter(Boolean);

const RPS_LEVELS = [80, 100, 200];
const DURATION = Number(process.env.DURATION || 45);
const LOCAL_FALLBACK = process.env.LOCAL_URL || "http://localhost:3000";

async function probe(url) {
  try {
    const t0 = performance.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    return { ok: res.ok, ms: Math.round(performance.now() - t0), status: res.status };
  } catch (e) {
    return { ok: false, error: (e).message };
  }
}

async function resolveBaseUrl() {
  for (const url of CANDIDATE_URLS) {
    const r = await probe(url);
    console.log(`Probe ${url}:`, r);
    if (r.ok) return { url, mode: "wan" };
  }
  const local = await probe(LOCAL_FALLBACK);
  if (local.ok) {
    console.log(`WAN unavailable; using production build at ${LOCAL_FALLBACK}`);
    return { url: LOCAL_FALLBACK, mode: "production-build-local" };
  }
  throw new Error("No reachable URL. Start: PORT=3000 bun run start");
}

function runNodeBench(url, rps) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "benchmarks/run-load-test.mjs",
        "--url",
        url,
        "--rps",
        String(rps),
        "--duration",
        String(DURATION),
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
      process.stdout.write(d);
    });
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`bench failed rps=${rps}`));
      else {
        const m = out.match(/\{[\s\S]*"label"[\s\S]*\}/);
        resolve(m ? JSON.parse(m) : null);
      }
    });
  });
}

async function measureDbHost() {
  try {
    const env = await readFile(".env", "utf8");
    const line = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
    if (!line) return null;
    const host = new URL(line).hostname;
    const t0 = performance.now();
    try {
      await fetch(`https://${host}`, { signal: AbortSignal.timeout(15000) });
    } catch {
      /* expected if no HTTPS */
    }
    return { host, note: "Use ping/curl from thesis machine in Gurugram for WAN RTT" };
  } catch {
    return null;
  }
}

async function main() {
  const { url, mode } = await resolveBaseUrl();
  const db = await measureDbHost();
  const results = [];

  for (const rps of RPS_LEVELS) {
    console.log(`\n--- ${rps} RPS ---`);
    results.push(await runNodeBench(url, rps));
  }

  const payload = {
    generated_at: new Date().toISOString(),
    mode,
    base_url: url,
    duration_sec: DURATION,
    database_host: db,
    results,
  };

  await mkdir("benchmarks/results", { recursive: true });
  const out = `benchmarks/results/production-suite-${Date.now()}.json`;
  await writeFile(out, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
