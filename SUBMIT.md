# Final submission checklist

## Submit this file

**`ScribeFlow_REVISED.docx`** (≈674 KB) — your original **figures 1–8 are preserved** (WMF diagrams from `ScribeFlow_FINAL.docx`), plus supervisor revisions and **Table IV** load-test paragraph.

Regenerate after edits:

```bash
python3 scripts/merge-revised-paper.py
```

Markdown backup: `docs/ScribeFlow_REVISED.md`

---

## Benchmark evidence (include in ZIP)

| File | Content |
|------|---------|
| `benchmarks/results/production-suite-*.json` | Production-build tests @ 80/100/200 RPS |
| `benchmarks/results/load-rps80-*.json` | ScribeFlow vs reference Next.js |
| `docs/BENCHMARK_RESULTS.md` | Summary tables |

**Table IV (production build, 45 s, GET /):**

| RPS | p50 | p95 | p99 | Mean | σ | Errors |
|-----|-----|-----|-----|------|---|--------|
| 80 | 5 ms | 8 ms | 23 ms | 6 ms | 5 ms | 0% |
| 100 | 4 ms | 7 ms | 19 ms | 5 ms | 3 ms | 0% |
| 200 | 3 ms | 7 ms | 25 ms | 4 ms | 5 ms | 0% |

Re-run anytime:

```bash
PORT=3000 bun run start &
bun run benchmark:production
```

---

## Vercel (optional WAN numbers)

Project: **scribeflow-thesis**  
Production URL: **https://scribeflow-thesis.vercel.app**

Env vars were pushed from `.env`. If deploy fails:

1. Vercel dashboard → Project → Settings → Environment Variables — verify `NEXTAUTH_URL` is `https://scribeflow-thesis.vercel.app` (not a multi-line blob).
2. Disable **Deployment Protection** (SSO) for preview URLs, or use the production alias.
3. Redeploy: `vercel deploy --prod --yes`
4. WAN load test:  
   `node benchmarks/run-load-test.mjs --url https://scribeflow-thesis.vercel.app --rps 80 --duration 45`

`scribeflow.app` does not resolve in DNS yet — use the Vercel URL above.

---

## Database migration

When Supabase is reachable:

```bash
bun run db:migrate
```

Adds `files.version` for optimistic concurrency (autosave).

---

## Code appendix paths (supervisor request)

Listed in **Appendix A** inside `ScribeFlow_REVISED.docx` and in `docs/PAPER_REVISION.md`.
