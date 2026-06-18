import { db, pool } from "@/app/src/db";
import { account, corsairAccounts, corsairIntegrations } from "@/app/src/db/schema";
import { eq, and } from "drizzle-orm";
import { generateDEK, encryptDEK, createAccountKeyManager } from "corsair/core";
import { createCorsairDatabase } from "corsair/db";
import * as crypto from "crypto";

export async function syncGoogleTokensToCorsair(userId: string) {
  console.log(`\n=== 🛠️ STEP 1: Starting Sync for User ID: [${userId}] ===`);
  
  try {
    // 1. Trace Check: Inspect the target Corsair account row right now
    const initialCheck = await db
      .select()
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, userId));
    console.log(`🔍 [DB Trace 1/4] Existing records in corsair_accounts count: ${initialCheck.length}`);

    // 2. Fetch user's Google account credentials from Better Auth
    console.log(`🛰️ [DB Query] Searching Better Auth 'account' table for user: ${userId}...`);
    const baAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, "google")
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!baAccount) {
      console.log(`❌ [Sync Stopped] No row found in Better Auth account table for user ID: ${userId}`);
      return { success: false, reason: "No Better Auth account found" };
    }
    
    console.log(`✅ [DB Trace 2/4] Better Auth record located! Token Snippet: ${baAccount.accessToken?.substring(0, 10)}...`);

    // 3. Fetch the global Gmail application identifier from Corsair
    console.log("🛰️ [DB Query] Fetching Gmail integration ID from corsair_integrations...");
    const gmailIntegration = await db
      .select()
      .from(corsairIntegrations)
      .where(eq(corsairIntegrations.name, "gmail"))
      .limit(1)
      .then((rows) => rows[0]);

    if (!gmailIntegration) {
      console.log("❌ [Sync Stopped] Gmail integration row is missing. Run 'pnpm corsair setup --plugin=gmail' first.");
      return { success: false, reason: "Global Gmail integration missing from DB" };
    }

    console.log(`✅ [DB Trace 3/4] Integration metadata verified. ID: ${gmailIntegration.id}`);

    // 4. Check for existing row configuration match
    const existingCorsairAccount = await db
      .select()
      .from(corsairAccounts)
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairAccounts.integrationId, gmailIntegration.id)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    const corsairDatabase = createCorsairDatabase(pool);

    if (!existingCorsairAccount) {
      console.log(`➕ [DB Write] No row exists in corsair_accounts. Creating blank row shell...`);
      
      const newDek = generateDEK();
      const encryptedDek = await encryptDEK(newDek, process.env.CORSAIR_KEK!);
      const newAccountId = crypto.randomUUID();

      await db.insert(corsairAccounts).values({
        id: newAccountId,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: userId,
        integrationId: gmailIntegration.id,
        config: "{}",
        dek: encryptedDek,
      });
      console.log(`✨ Blank row successfully inserted. Account ID assigned: ${newAccountId}`);
    } else {
      console.log(`🔄 Target row shell already exists for this tenant. Proceeding to update credentials directly.`);
    }

    // 5. Encrypt credentials via Key Manager envelope handler
    console.log(`🔒 [Crypto Action] Passing tokens to createAccountKeyManager wrapper...`);
    const keyManager = createAccountKeyManager({
      authType: "oauth_2",
      integrationName: "gmail",
      tenantId: userId,
      kek: process.env.CORSAIR_KEK!,
      database: corsairDatabase,
    });

    await keyManager.set_access_token(baAccount.accessToken);
    
    if (baAccount.refreshToken) {
      await keyManager.set_refresh_token(baAccount.refreshToken);
      console.log("🔑 Refresh Token injected into crypto engine.");
    }
    if (baAccount.accessTokenExpiresAt) {
      const expiresAtSeconds = Math.floor(new Date(baAccount.accessTokenExpiresAt).getTime() / 1000);
      await keyManager.set_expires_at(String(expiresAtSeconds));
    }
    if (baAccount.scope) {
      await keyManager.set_scope(baAccount.scope);
    }

    // 6. Final verification check post-encryption runtime
    const finalVerification = await db
      .select()
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    console.log(`📊 [DB Trace 4/4] Post-Sync Config Column length in DB: ${finalVerification?.config?.length} characters.`);
    console.log(`=== ✅ STEP 2: Token Sync Operations Complete ===\n`);

    // Explicitly return data object instead of leaving it undefined
    return { success: true, payloadSynced: true, tenantId: userId };

  } catch (error) {
    console.error("❌ [Sync Engine Crash] Fatal error inside token sync function:", error);
    return { success: false, error };
  }
}