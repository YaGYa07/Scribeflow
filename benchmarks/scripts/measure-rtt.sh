#!/usr/bin/env bash
# Measure HTTP latency to deployment and (optionally) database host.
# Usage:
#   ./benchmarks/scripts/measure-rtt.sh https://your-app.vercel.app
#   DATABASE_HOST=db.xxx.supabase.co ./benchmarks/scripts/measure-rtt.sh https://...

set -euo pipefail

APP_URL="${1:-http://localhost:3000}"
SAMPLES="${SAMPLES:-20}"

echo "=== HTTP timing: ${APP_URL} (${SAMPLES} samples) ==="
for i in $(seq 1 "$SAMPLES"); do
  curl -s -o /dev/null -w "%{time_connect} %{time_starttransfer} %{time_total}\n" "$APP_URL/"
done | awk '
  { connect+=$1; ttfb+=$2; total+=$3; n++ }
  END {
    if (n==0) exit 1
    printf "avg connect: %.3fs  avg TTFB: %.3fs  avg total: %.3fs (n=%d)\n", connect/n, ttfb/n, total/n
  }'

if [[ -n "${DATABASE_HOST:-}" ]]; then
  echo ""
  echo "=== ICMP to database host: ${DATABASE_HOST} (informational) ==="
  ping -c 5 "$DATABASE_HOST" || true
fi

echo ""
echo "Document in your paper:"
echo "  - Client machine city/region and ISP"
echo "  - App region (e.g. Vercel bom1)"
echo "  - Supabase region (e.g. eu-central-1)"
echo "  - Do NOT label edge RTT as database RTT"
