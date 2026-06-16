// If TypeScript cannot find types for 'drizzle-kit', import at runtime and treat as any
// this avoids "Cannot find module 'drizzle-kit' or its corresponding type declarations." errors
const { defineConfig } = require("drizzle-kit") as { defineConfig: any };
import { env } from "process";

export default defineConfig({
  schema: "./app/src/db/schema.ts", // adjust path to your schema
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});