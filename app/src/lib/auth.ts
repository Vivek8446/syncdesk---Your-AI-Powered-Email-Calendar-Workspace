import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/app/src/db/index"; // your drizzle db instance
import { user, session, account, verification } from "@/app/src/db/schema";

export const auth = betterAuth({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET!,
        scope: [
        "openid",
        "email",
        "profile",
      // Gmail - you need FULL access, not just readonly
        "https://www.googleapis.com/auth/gmail.modify",  // read + send + draft + labels
        // OR if sending is needed:
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.compose",

        // Calendar - this one is fine ✅
        "https://www.googleapis.com/auth/calendar",
      ],
    }
  },
});