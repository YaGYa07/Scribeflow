import { pgTableCreator } from "drizzle-orm/pg-core";

import { DB_TABLE_PREFIX } from "@/config/site";

/**
 * Use to keep multiple projects schemas/tables in the same database.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `${DB_TABLE_PREFIX}_${name}`
);
