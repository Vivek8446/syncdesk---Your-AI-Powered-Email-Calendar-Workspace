import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { user, session, account, verification } from "./schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, {
  schema: { user, session, account, verification },
});