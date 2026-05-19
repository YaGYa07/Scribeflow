/**
 * Resolves the Postgres URL for the current runtime.
 *
 * Supabase direct hosts (`db.<ref>.supabase.co`) are often IPv6-only.
 * Vercel serverless frequently fails with ENOTFOUND on those hosts.
 * Use the transaction pooler in ap-south-1 (or set DATABASE_URL_POOLED).
 */
export function getDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL;
  if (!direct) {
    throw new Error("DATABASE_URL is not set");
  }

  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  if (pooled) {
    return pooled;
  }

  if (!process.env.VERCEL) {
    return direct;
  }

  return toSupabasePoolerUrl(direct) ?? direct;
}

function toSupabasePoolerUrl(directUrl: string): string | null {
  let parsed: URL;

  try {
    parsed = new URL(directUrl);
  } catch {
    return null;
  }

  const ref = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
  if (!ref) {
    return null;
  }

  if (parsed.hostname.includes("pooler.supabase.com")) {
    return directUrl;
  }

  const region = process.env.SUPABASE_REGION?.trim() || "ap-south-1";
  // Supabase ap-south-1 uses aws-1-* pooler hosts (aws-0-* fails with tenant not found).
  const poolerPrefix = process.env.SUPABASE_POOLER_PREFIX?.trim() || "aws-1";
  const password = parsed.password;
  const username = `postgres.${ref}`;

  const pooler = new URL(directUrl);
  pooler.username = username;
  pooler.password = password;
  pooler.hostname = `${poolerPrefix}-${region}.pooler.supabase.com`;
  pooler.port = "6543";
  pooler.pathname = "/postgres";
  pooler.search = "";

  return pooler.toString();
}

export function isPoolerUrl(url: string): boolean {
  return url.includes("pooler.supabase.com") || url.includes("pgbouncer=true");
}
