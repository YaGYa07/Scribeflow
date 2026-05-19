#!/usr/bin/env node
/** Merge latest benchmark JSON into docs/BENCHMARK_RESULTS.md */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = "benchmarks/results";
const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
const latest = files.at(-1);
if (!latest) {
  console.log("No results yet. Run: node benchmarks/run-load-test.mjs --compare");
  process.exit(0);
}
const data = JSON.parse(await readFile(join(dir, latest), "utf8"));

let md = `# Benchmark results (auto-generated)\n\nSource: \`${latest}\`\n\n`;
md += `| Stack | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Mean (ms) | Std dev (ms) | Error rate |\n`;
md += `|-------|-----|----------|----------|----------|-----------|--------------|------------|\n`;
for (const r of data.results) {
  md += `| ${r.label} | ${r.target_rps} | ${r.p50_ms} | ${r.p95_ms} | ${r.p99_ms} | ${r.mean_ms} | ${r.stddev_ms} | ${r.error_rate} |\n`;
}
await writeFile("docs/BENCHMARK_RESULTS.md", md);
console.log("Updated docs/BENCHMARK_RESULTS.md");
