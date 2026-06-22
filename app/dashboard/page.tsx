import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { corsair } from "@/corsair";
import { syncGoogleTokensToCorsair } from "@/app/src/lib/sync-tokens";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userId = user.id;

  try {
    await syncGoogleTokensToCorsair(userId);
  } catch (err) {
    console.error("Token sync failed:", err);
  }

  let gmailConnected = false;
  let messages: any[] = [];
  let fetchError: string | null = null;

  try {
    console.log("Fetching Gmail list for user:", userId);
    
    // Use type assertion to avoid the 'never' type-checking compilation error
    const listRes = await (corsair as any)
      .withTenant(userId)
      .gmail.api.messages.list({ 
        maxResults: 15,
        q: "label:INBOX"
      });

    if (listRes && listRes.messages && listRes.messages.length > 0) {
      const detailedMessagesPromises = listRes.messages.map(async (msg: any) => {
        try {
          const fullMessage = await (corsair as any)
            .withTenant(userId)
            .gmail.api.messages.get({ id: msg.id, format: "full" });
          
          const headersList = fullMessage.payload?.headers || [];
          const subject = headersList.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
          const from = headersList.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";

          return {
            id: fullMessage.id,
            threadId: fullMessage.threadId,
            snippet: fullMessage.snippet || "",
            subject,
            from,
          };
        } catch (err) {
          console.error(`Failed to fetch details for message ${msg.id}:`, err);
          return null;
        }
      });

      const resolvedMessages = await Promise.all(detailedMessagesPromises);
      messages = resolvedMessages.filter((msg) => msg !== null);
    }
    
    gmailConnected = true;
  } catch (error: any) {
    console.log("Gmail is not connected or fetch failed:", error?.message || error);
    fetchError = error?.message || String(error);
  }

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
