/**
 * Shared k6 configuration for ScribeFlow load tests.
 *
 * Environment variables:
 *   BASE_URL          — deployment under test (default http://localhost:3000)
 *   TARGET_RPS        — arrival rate for load.js (default 100)
 *   DURATION          — test duration, e.g. 5m (default 3m)
 *   K6_SESSION_COOKIE — optional; full Cookie header for authenticated routes
 */

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
export const TARGET_RPS = Number(__ENV.TARGET_RPS || 100);
export const DURATION = __ENV.DURATION || "3m";
export const SESSION_COOKIE = __ENV.K6_SESSION_COOKIE || "";

export const defaultHeaders = SESSION_COOKIE
  ? { Cookie: SESSION_COOKIE }
  : {};
