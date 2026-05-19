import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { BASE_URL, DURATION, TARGET_RPS, defaultHeaders } from "./config.js";

/**
 * Constant-arrival-rate load test (public routes).
 * Re-run at TARGET_RPS=100,200,500 and record p50/p95/p99 from the summary.
 */
export const options = {
  scenarios: {
    public_load: {
      executor: "constant-arrival-rate",
      rate: TARGET_RPS,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: Math.min(TARGET_RPS, 200),
      maxVUs: Math.max(TARGET_RPS * 2, 50),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`, { headers: defaultHeaders });
  check(res, { "home 200": (r) => r.status === 200 });
  sleep(0.05);
}

export function handleSummary(data) {
  const file = `benchmarks/results/load-rps${TARGET_RPS}-${Date.now()}.json`;
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    [file]: JSON.stringify(data, null, 2),
  };
}
