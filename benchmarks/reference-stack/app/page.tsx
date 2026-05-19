/**
 * Minimal Next.js reference app for load-test comparison (supervisor requirement).
 * Equivalent public route to ScribeFlow home page — no Drizzle/Prisma DB on hot path.
 */
export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Reference Stack (Next.js)</h1>
      <p>Baseline comparison target for k6 / Node load tests.</p>
    </main>
  );
}
