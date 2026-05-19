import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { getDatabaseUrl } from "@/lib/db/database-url";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url = getDatabaseUrl();
    const host = new URL(url).hostname;
    const result = await db.execute(sql`select 1 as ok`);
    const row = result[0] as { ok?: number } | undefined;

    return NextResponse.json({
      ok: true,
      host,
      vercel: !!process.env.VERCEL,
      pooled: url.includes("pooler.supabase.com"),
      db: row?.ok === 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    let host = "invalid DATABASE_URL";

    try {
      host = new URL(getDatabaseUrl()).hostname;
    } catch {
      /* ignore */
    }

    return NextResponse.json(
      {
        ok: false,
        host,
        vercel: !!process.env.VERCEL,
        error: message,
      },
      { status: 500 }
    );
  }
}
