# ScribeFlow: A Collaborative Workspace Platform with Secure Authentication, Hierarchical Content Management, and Cloud-Native Deployment

**Yagya Sharma**  
ORCID: 0009-0009-1358-5312  
M.Tech. Research Scholar, Department of Computer Science & Engineering

**Under the Guidance of**  
Mr. Chhattarpal · Ms. Bhawna Sharma  
Assistant Professors, Department of Computer Science & Engineering  
BM Group of Institutions, Farrukhnagar, Gurugram

Corresponding author: yagya.sharma436@gmail.com

---

## Abstract

This study presents ScribeFlow, a full-stack collaborative workspace platform addressing structured content organization, secure authentication, and cloud-native deployment. ScribeFlow is implemented with Next.js (App Router), TypeScript, Drizzle ORM, and PostgreSQL, with OAuth-based identity management via NextAuth and **workspace-scoped access control (ACL)** for multi-tenant collaboration.

Performance was evaluated using **constant-arrival-rate load tests** at 80–500 requests per second (RPS) on a standardized development host, reporting **p50, p95, and p99** latencies with mean and standard deviation (Table IV). Under 80–200 RPS, the public home route exhibited sub-10 ms median latency on loopback with zero errors; at 500 RPS the development server saturated (24.4% errors), defining a local capacity bound. A **reference Next.js** deployment was tested under the same script for controlled comparison.

Separately, **within-subject** measurements on an optimized versus baseline codebase showed reductions in page load (51%), OAuth login (44%), and workspace-list query time (50%); these are reported as engineering iterations, not as controlled experiments against third-party products.

The system is characterized as a **deployable cloud-native prototype**, not a production-certified SaaS. Limitations include the absence of CRDT-based real-time editing, application-layer-only tenant isolation (no PostgreSQL RLS), and JWT sessions without server-side revocation. Implementation artifacts are listed in Appendix A.

**Keywords:** collaborative workspace, Next.js, PostgreSQL, OAuth authentication, SaaS architecture, TypeScript, Drizzle ORM, load testing, optimistic concurrency

---

## I. Introduction

The proliferation of remote work has increased demand for web-based platforms that combine document authoring, organizational hierarchy, and access-controlled sharing. Engineering challenges include cross-provider authentication, modelling ownership in a queryable store, and maintaining low latency at scale [1, 4].

Commercial systems (Notion, Confluence, Google Docs, Obsidian) address parts of this space but are often proprietary, opaque, or weak on typed, self-hosted extensibility [2, 10]. This work introduces **ScribeFlow**, built on Next.js, TypeScript, Drizzle ORM, and PostgreSQL with NextAuth.

The primary objective is to show that a typed, modular architecture can evolve from prototype to **deployable** system through incremental phases. A secondary objective is to quantify latency under **documented load-test methodology** and internal optimization passes.

Section II reviews related work; Section III presents design and security; Section IV gives results; Section V discusses limitations; Section VI concludes.

---

## II. Related Work

### A. Commercial Collaborative Platforms

Notion [3] provides hierarchical pages and workspace access control but is closed-source. Confluence [4] offers enterprise RBAC at high operational cost. Google Docs [13] uses OT/CRDT for real-time editing but lacks hierarchical workspace schema extensibility [6]. Obsidian [14] is local-first without native multi-user cloud ACL.

### B. Access Control in Web Systems

Sandhu et al. [8] formalize **RBAC** with role hierarchies and permission matrices. ScribeFlow implements a **two-principal ACL** per workspace: **owner** (`workspace_owner_id`) and **collaborator** (`collaborators` table). This is **not** hierarchical RBAC; it is workspace-scoped membership evaluated server-side before data access. Enterprise role models are future work.

### C. Type-Safe Web Architectures

Drizzle ORM derives TypeScript types from schema definitions [9]. Combined with Zod-validated environment configuration, ScribeFlow enforces a compile-time boundary from configuration through mutations.

### D. Gap Analysis

**Table II — Feature comparison**

| Feature | Notion | Confluence | Google Docs | Obsidian | ScribeFlow |
|---------|--------|------------|-------------|----------|------------|
| Hierarchical structure | ✓ | ✓ | ✗ | ✓ | ✓ (ws/folder/file) |
| Real-time co-editing (CRDT/OT) | ✓ | ✓ | ✓ | ✗ | ✗ (planned) |
| Workspace ACL | Limited | ✓ (RBAC) | Limited | ✗ | ✓ (owner/collaborator) |
| Open source / self-hostable | ✗ | ✗ | ✗ | ✓ (local) | ✓ |
| Typed schema (ORM) | ✗ | ✗ | ✗ | ✗ | ✓ (Drizzle) |
| OAuth | ✓ | ✓ | ✓ | ✗ | ✓ (NextAuth) |
| Autosave + OCC | ✓ | ✓ | ✓ | ✓ | ✓ (500 ms, version column) |
| Custom deployment | ✗ | DC | ✗ | ✓ | ✓ (Vercel/Docker) |

---

## III. Methods

### A. System Architecture

Five layers (Figure 1): Presentation (App Router UI); Application (server actions); Data (PostgreSQL + Drizzle migrations); Identity (NextAuth JWT); Operational (Zod env validation, optional Upstash rate limiting, Docker).

### B. Core Data Model

Entities: `user`, `workspace`, `folder`, `file`, `collaborator`, `newsletter_subscriber`. Workspaces are the tenancy boundary. Files include a monotonic **`version`** integer for optimistic concurrency (migration `0007_file_version.sql`).

### C. Security and Access Control

**C.1 ACL predicate**

`canAccess(w,u) ⇔ u = owner(w) ∨ (u,w) ∈ Collaborators`

Implemented in `lib/db/queries/workspace.ts` (`canAccessWorkspace`) and enforced in `app/dashboard/(workspaces)/[workspaceId]/layout.tsx`. **`middleware.ts`** performs authentication and rate limiting only—not workspace ACL.

**C.2 Multi-tenant isolation**

Isolation is enforced in application code by scoping queries to `workspace_id` after `canAccessWorkspace`. **PostgreSQL Row-Level Security is not enabled.** Rationale for this prototype: (1) a single service-role connection is used from server actions; (2) RLS would duplicate ACL predicates; (3) defense-in-depth RLS is documented in `docs/database/rls_policies.sql.example` for production hardening.

**C.3 JWT session policy**

| Policy | Value |
|--------|--------|
| Strategy | JWT (`lib/auth.ts`) |
| maxAge | 30 days |
| updateAge | 24 hours (sliding refresh) |
| Revocation | Client cookie cleared on sign-out; **no server-side denylist** |

**C.4 Autosave and concurrency**

- Debounce: **500 ms** (`lib/editor.ts`).
- Persistence: server action `updateFile` with **optimistic concurrency control (OCC)** on `files.version`.
- On `VERSION_CONFLICT`, the editor reloads server state (`getFileById`).
- **Limitation:** No CRDT/OT; simultaneous live editing is unsupported. Concurrent saves follow last-writer-wins only when versions match; otherwise the client is notified. Industry-standard CRDT sync (Yjs, Automerge) remains future work.

### D. Incremental Development Methodology

Six phases: (1) auth/session; (2) workspace/folder/file CRUD; (3) dashboard UX; (4) editor autosave + OCC; (5) collaborator invite/remove; (6) env/migration reliability.

### E. Deployment

Vercel serverless and Docker; schema via Drizzle migrations; Zod startup validation.

---

## IV. Results

### A. Experimental Setup

| Item | Configuration |
|------|----------------|
| Processor | Intel Core i5-12450H (8 cores) |
| Memory | 16 GB DDR4 |
| OS | Ubuntu 22.04 LTS / macOS (load tests) |
| Runtime | Node.js 22.11, Bun 1.x |
| Database | PostgreSQL 16 (Supabase, eu-central-1) with PgBouncer |
| App deploy | Vercel (edge PoP varies by client location) |
| Load tool | `benchmarks/run-load-test.mjs`, `benchmarks/k6/load.js` |

**Network measurement (corrected):** Prior drafts reported ~12 ms RTT to “Supabase (Frankfurt)” from Gurugram. That figure conflates **edge/CDN RTT** with **database RTT**. India→Frankfurt one-way propagation is on the order of **130 ms minimum** (speed of light). We therefore report:

- **Loopback load tests** (Table IV): `http://127.0.0.1:3000` — measures application stack on the dev host, not WAN DB latency.
- **Production WAN tests** (recommended): run `benchmarks/scripts/measure-rtt.sh` separately for `BASE_URL` (Vercel) and `DATABASE_HOST` (Supabase pooler).

### B. Load Testing (HTTP `GET /`)

Constant-arrival-rate for duration *T* at target RPS. Metrics: p50, p95, p99, mean, sample standard deviation, error rate.

**Table IV — ScribeFlow load test (localhost laboratory)**

| Target RPS | Duration | p50 (ms) | p95 (ms) | p99 (ms) | Mean (ms) | Std dev (ms) | Error rate |
|------------|----------|----------|----------|----------|-----------|--------------|------------|
| 80 | 45 s | 5 | 6 | 23 | 5 | 4 | 0.00% |
| 100 | 30 s | 5 | 5 | 8 | 5 | 3 | 0.00% |
| 200 | 30 s | 4 | 5 | 9 | 4 | 5 | 0.00% |
| 500 | 20 s | 68 | 8028 | 8031 | 2510 | 3420 | 24.38% |

At 500 RPS the development process saturated; cloud deployments with autoscaling should be re-tested for thesis final submission.

**Table V — Reference stack comparison @ 80 RPS (45 s)**

| Stack | p50 | p95 | p99 | Mean | Std dev | Errors |
|-------|-----|-----|-----|------|---------|--------|
| ScribeFlow | 5 ms | 6 ms | 23 ms | 5 ms | 4 ms | 0% |
| Reference Next.js (`benchmarks/reference-stack/`) | 2 ms | 3 ms | 4 ms | 2 ms | 1 ms | 0% |

Scripts: `benchmarks/k6/load.js`, `benchmarks/run-load-test.mjs`. Full logs in `benchmarks/results/`.

### C. Within-Subject Optimization (Table I)

Baseline vs optimized builds on the **same** codebase (not third-party controlled trials):

| Metric | Baseline | Optimized |
|--------|----------|-----------|
| Page load (ms) | ~850 | ~420 |
| OAuth login (ms) | ~320 | ~180 |
| Autosave round-trip (ms) | N/A | ~240 |
| DB workspace list (ms) | ~90 | ~45 |
| JS bundle gzip (KB) | ~310 | ~218 |
| Collaborator invite (ms) | ~500 | ~210 |
| SSR (ms) | ~180 | ~95 |

Improvements align with React Server Components and connection pooling [5, 10]. **Partial Prerendering, streaming SSR, and Edge runtime** were not benchmarked in this revision.

### D. Functional Validation

20 trials each: OAuth login; ACL redirect; rename persistence; autosave with OCC; collaborator invite/remove; newsletter deduplication—all passed.

### E. Defects (Table III)

Four integration defects at layer boundaries (session cookies, NextAuth schema, migration casts, rename UX)—resolved as documented in the original study.

---

## V. Discussion

ScribeFlow demonstrates a type-safe path from prototype to deployable SaaS-shaped software. Load tests at 80–200 RPS on loopback show stable median latencies; reference comparison isolates added middleware and page weight.

**Limitations**

1. Load tests on localhost do not replace WAN/production characterization; re-run at 100–500 RPS against Vercel + Supabase from the thesis lab machine in Gurugram.
2. **No CRDT/OT** — not competitive with Google Docs/Notion for live co-editing.
3. **ACL only** — not Sandhu-style RBAC [8].
4. **No PostgreSQL RLS** in the deployed prototype.
5. **JWT** without instant revocation.
6. **OCC** reduces silent overwrites but does not merge concurrent edits.
7. Next.js **PPR / Edge** not evaluated.

---

## VI. Conclusion

ScribeFlow contributes: (i) five-layer architecture with workspace ACL; (ii) six-phase incremental methodology; (iii) documented load-test and optimization evidence; (iv) platform comparison table. Future work: Yjs/Automerge CRDT sync, hierarchical RBAC, RLS + audit logs, JWT denylist, and evaluation of Partial Prerendering and Edge rendering.

---

## Appendix A — Implementation Artifacts

| Artifact | Repository path |
|----------|-----------------|
| Drizzle schema (workspaces, folders, files, collaborators) | `lib/db/schema/app.ts` |
| Auth tables | `lib/db/schema/auth.ts` |
| Workspace authorization | `lib/db/queries/workspace.ts`, `app/dashboard/(workspaces)/[workspaceId]/layout.tsx` |
| NextAuth providers | `config/auth.ts` |
| NextAuth session (JWT policy) | `lib/auth.ts`, `lib/auth-session.ts` |
| Auth middleware (login/rate limit) | `middleware.ts` |
| Autosave + OCC update | `app/dashboard/(workspaces)/[workspaceId]/[fileId]/page.tsx`, `lib/db/queries/file.ts` |

---

## Appendix B — Benchmark Reproduction

```bash
bun install
bun run db:migrate          # requires live DATABASE_URL
SKIP_ENV_VALIDATION=true bun run build
PORT=3000 bun run start &
node benchmarks/run-load-test.mjs --compare --rps 80 --duration 45
```

---

## Conflict of Interest

The authors declare no conflict of interest.

## Funding

No external funding.

## References

[1]–[15] as in original manuscript (Ousterhout; Gamma et al.; Notion; Atlassian; Vercel; Kleppmann et al.; Shapiro et al.; Sandhu et al.; Bierman et al.; Dragoni et al.; Bauer & King; Fielding; Google; Obsidian; Wohlin et al.).
