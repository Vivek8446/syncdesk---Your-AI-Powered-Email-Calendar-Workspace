import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { user, session, account, verification } from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, {
  schema: { user, session, account, verification },
});