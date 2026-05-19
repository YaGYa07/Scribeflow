# ScribeFlow — paper revision guide (supervisor feedback)

Copy the sections below into `ScribeFlow_FINAL.docx`. Code changes in this repo support the claims.

---

## Abstract (tone down)

Replace “production-ready” with **“deployable cloud-native prototype”**.

Replace unqualified performance claims with: *“Under k6 load tests at X RPS (see Section IV), median latency was …; internal baseline-vs-optimized comparisons are reported separately and are not treated as controlled experiments against third-party stacks.”*

---

## Section II — RBAC → ACL

**Replace** sentences claiming Sandhu-style RBAC with:

> ScribeFlow implements **workspace-scoped access control (ACL)** with two principals: the workspace **owner** (`workspace_owner_id`) and **collaborators** (`collaborators` table). This is not hierarchical RBAC [8]; role-permission matrices and inheritance are left as future work.

Update Table II: change “Role-based Access Control” row to **“Workspace ACL (owner / collaborator)”**.

---

## Section III.C — Security (add subsections)

### C.1 Access control

Formal predicate (unchanged):

`canAccess(w,u) ⇔ u = owner(w) ∨ (u,w) ∈ Collaborators`

Implementation: `lib/db/queries/workspace.ts` (`canAccessWorkspace`), enforced in `app/dashboard/(workspaces)/[workspaceId]/layout.tsx` (not in `middleware.ts`, which only handles authentication and rate limiting).

### C.2 Multi-tenant isolation

Tenant boundary = `workspace_id` on folders and files. Enforcement is **application-layer** via `canAccessWorkspace` before reads/writes.

**RLS:** PostgreSQL Row-Level Security is **not enabled**. Justification for this prototype: (1) Drizzle/Next.js server actions already run with a single service role; (2) RLS policies would duplicate ACL logic and complicate migrations; (3) defense-in-depth RLS is recommended for production and provided as an example in `docs/database/rls_policies.sql.example`.

### C.3 JWT session policy

Documented in `lib/auth-session.ts` and `lib/auth.ts`:

| Policy | Value |
|--------|--------|
| Strategy | JWT (`session.strategy: "jwt"`) |
| maxAge | 30 days |
| updateAge | 24 hours (sliding refresh while active) |
| Revocation | Sign-out clears client cookie; **no server-side denylist**—stolen JWTs remain valid until expiry unless database sessions or a blocklist is added |

### C.4 Autosave and concurrency

- Debounce: **500 ms** (`lib/editor.ts`, file editor page).
- **Optimistic concurrency:** `files.version` column; updates succeed only if `version` matches (`lib/db/queries/file.ts`).
- **Limitation:** Simultaneous live co-editing is **not** supported (no CRDT/OT). Concurrent saves may conflict; the client refreshes from the server on `VERSION_CONFLICT`. True multi-user editing requires Yjs/Automerge (future work).

---

## Section IV — Methodology (rewrite)

### Test environment (must be accurate)

| Item | Your value (fill in) |
|------|----------------------|
| Client machine | City, region, ISP |
| App hosting | e.g. Vercel region |
| Database | e.g. Supabase `eu-central-1` (Frankfurt) |
| Tool | k6 v0.xx |
| Scripts | `benchmarks/k6/load.js`, `benchmarks/k6/smoke.js` |

**Do not** report Vercel-edge RTT as database RTT. Run `benchmarks/scripts/measure-rtt.sh` and report both paths.

### Load protocol

- Executor: `constant-arrival-rate`
- Rates: **100, 200, 500 RPS** (separate runs)
- Duration: ≥ 3 minutes per run after warm-up
- Metrics: **p50, p95, p99**, mean, standard deviation
- Report `http_req_failed` rate

### Baseline vs optimized

Label as **within-subject engineering comparison** on the same codebase, not a controlled experiment. Add at least one **reference** measurement (minimal Next.js + Prisma app, or cited external benchmark) under the same k6 script.

---

## Section V — Limitations (expand)

1. Load testing previously used ~10 simulated users; revised results use k6 at 100–500 RPS (after you run benchmarks).
2. **No real-time collaborative editing** (CRDT/OT deferred); autosave uses debounce + version-based OCC, not mergeable concurrent edits.
3. **ACL only**—not enterprise RBAC.
4. **No PostgreSQL RLS** in the deployed prototype.
5. **JWT** without instant revocation/denylist.
6. Next.js **PPR, streaming SSR, Edge runtime** were not evaluated; performance gains attributed to RSC, pooling, and bundle reduction should be stated narrowly.

---

## Section VI — Future work (prioritize)

1. Yjs or Automerge for CRDT-based sync.
2. Hierarchical RBAC (viewer / editor / admin).
3. PostgreSQL RLS + audit log.
4. JWT denylist or database sessions for revocation.
5. Evaluate Partial Prerendering and Edge routes for read-heavy paths.

---

## Appendix — Implementation artifacts (supervisor request)

| Artifact | Path |
|----------|------|
| Drizzle schema (workspaces, folders, files, collaborators) | `lib/db/schema/app.ts` |
| Auth schema | `lib/db/schema/auth.ts` |
| Workspace authorization | `lib/db/queries/workspace.ts`, `app/dashboard/(workspaces)/[workspaceId]/layout.tsx` |
| NextAuth config | `config/auth.ts`, `lib/auth.ts` |
| Autosave + server update | `app/dashboard/.../[fileId]/page.tsx`, `lib/db/queries/file.ts` |
| Auth middleware (login only) | `middleware.ts` |

Include abbreviated listings or a GitHub appendix link in the submission.
