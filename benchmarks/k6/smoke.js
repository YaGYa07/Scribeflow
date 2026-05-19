import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, defaultHeaders } from "./config.js";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const routes = ["/", "/pricing", "/terms", "/privacy"];

  for (const route of routes) {
    const res = http.get(`${BASE_URL}${route}`, { headers: defaultHeaders });
    check(res, {
      [`${route} status 200`]: (r) => r.status === 200,
    });
    sleep(0.2);
  }
}
