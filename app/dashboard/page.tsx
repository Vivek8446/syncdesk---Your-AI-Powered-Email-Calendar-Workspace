import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

  // Sync tokens server-side (needed before client can call /api/gmail)
  let gmailConnected = false;
  try {
    await syncGoogleTokensToCorsair(userId);
    gmailConnected = true;
  } catch (err) {
    console.error("Token sync failed:", err);
  }

  // Render immediately — emails will be fetched client-side
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
      initialMessages={[]}
      fetchError={null}
    />
  );
}