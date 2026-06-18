import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createCorsair } from 'corsair';
import {  gmail } from '@corsair-dev/gmail';
import { github } from '@corsair-dev/github';
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from '@/app/src/db';
import 'dotenv/config'
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const db = drizzle(pool); // your app tables

export const corsair = createCorsair({
    plugins: [gmail(), github(), googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
