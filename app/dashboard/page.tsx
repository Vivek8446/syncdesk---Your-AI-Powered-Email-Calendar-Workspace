import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { corsair } from "@/corsair";
import { syncGoogleTokensToCorsair } from "@/app/src/lib/sync-tokens";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const t0 = Date.now();
  console.log(`[1] DashboardPage started`);

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log(`[2] getSession done — ${Date.now() - t0}ms`);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userId = user.id;
  console.log(`[3] User resolved: ${userId}`);

  try {
    const tSync = Date.now();
    await syncGoogleTokensToCorsair(userId);
    console.log(`[4] syncGoogleTokensToCorsair done — ${Date.now() - tSync}ms (total: ${Date.now() - t0}ms)`);
  } catch (err) {
    console.error(`[4] Token sync FAILED — ${Date.now() - t0}ms`, err);
  }

  let gmailConnected = false;
  let messages: any[] = [];
  let fetchError: string | null = null;

  try {
    const tList = Date.now();
    console.log(`[5] Starting Gmail messages.list...`);

    const listRes = await (corsair as any)
      .withTenant(userId)
      .gmail.api.messages.list({
        maxResults: 15,
        q: "label:INBOX"
      });
    console.log(`[6] messages.list done — ${Date.now() - tList}ms (total: ${Date.now() - t0}ms) | count: ${listRes?.messages?.length ?? 0}`);

    if (listRes && listRes.messages && listRes.messages.length > 0) {
      console.log(`[7] Starting parallel messages.get for ${listRes.messages.length} messages...`);
      const tGet = Date.now();

      const detailedMessagesPromises = listRes.messages.map(async (msg: any, i: number) => {
        const tMsg = Date.now();
        try {
          const fullMessage = await (corsair as any)
            .withTenant(userId)
            .gmail.api.messages.get({ id: msg.id, format: "full" });
          console.log(`[7.${i + 1}] messages.get ${msg.id} done — ${Date.now() - tMsg}ms`);

          const headersList = fullMessage.payload?.headers || [];
          const subject = headersList.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
          const from = headersList.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
          const labelIds: string[] = fullMessage.labelIds || [];

          return {
            id: fullMessage.id,
            threadId: fullMessage.threadId,
            snippet: fullMessage.snippet || "",
            subject,
            from,
            labelIds,
            starred: labelIds.includes("STARRED"),
          };
        } catch (err) {
          console.error(`[7.${i + 1}] messages.get ${msg.id} FAILED — ${Date.now() - tMsg}ms`, err);
          return null;
        }
      });

      const resolvedMessages = await Promise.all(detailedMessagesPromises);
      console.log(`[8] All messages.get settled — ${Date.now() - tGet}ms (total: ${Date.now() - t0}ms)`);

      messages = resolvedMessages.filter((msg) => msg !== null);
      console.log(`[9] Filtered messages: ${messages.length} valid, ${resolvedMessages.length - messages.length} failed`);
    }

    gmailConnected = true;
    console.log(`[10] Gmail fetch complete — total: ${Date.now() - t0}ms`);
  } catch (error: any) {
    console.error(`[10] Gmail fetch FAILED — ${Date.now() - t0}ms | ${error?.message || error}`);
    fetchError = error?.message || String(error);
  }

  console.log(`[11] Rendering DashboardClient — total: ${Date.now() - t0}ms`);

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      }}
      gmailConnected={gmailConnected}
      initialMessages={messages}
      fetchError={fetchError}
    />
  );
}