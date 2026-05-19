import { pgTableCreator } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { DB_TABLE_PREFIX } from "@/config/site";
import { getDatabaseUrl, isPoolerUrl } from "@/lib/db/database-url";
import * as schema from "./schema";

function createPostgresClient() {
  const url = getDatabaseUrl();
  const usesPooler = isPoolerUrl(url);

  return postgres(url, {
    max: 1,
    connect_timeout: 20,
    idle_timeout: 20,
    prepare: !usesPooler,
    ssl: url.includes("supabase.co") ? "require" : undefined,
  });
}

const client = createPostgresClient();

export const db = drizzle(client, { schema });

export const createTable = pgTableCreator(
  (name) => `${DB_TABLE_PREFIX}_${name}`
);
