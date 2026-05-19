/**
 * Fixes DATABASE_URL when the password contains `@` but was not URL-encoded.
 * Example broken: postgresql://postgres:YagyaLipi@01@db.xxx.supabase.co:5432/postgres
 * Correct:       postgresql://postgres:YagyaLipi%4001@db.xxx.supabase.co:5432/postgres
 */
export function normalizeDatabaseUrl(raw: string): string {
  const url = raw.trim();
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    return url;
  }

  const protocol = url.startsWith("postgresql://") ? "postgresql://" : "postgres://";
  const rest = url.slice(protocol.length);
  const atPositions: number[] = [];

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "@") atPositions.push(i);
  }

  if (atPositions.length <= 1) {
    return url;
  }

  const lastAt = atPositions[atPositions.length - 1]!;
  const userinfo = rest.slice(0, lastAt);
  const hostpart = rest.slice(lastAt + 1);
  const colon = userinfo.indexOf(":");

  if (colon === -1) {
    return url;
  }

  const user = userinfo.slice(0, colon);
  const password = userinfo.slice(colon + 1);

  return `${protocol}${user}:${encodeURIComponent(password)}@${hostpart}`;
}
