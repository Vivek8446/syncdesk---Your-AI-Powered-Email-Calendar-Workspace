import { corsair } from "@/corsair";
import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
// import {gmail} from "@corsair-dev/gmail";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  // Generate a Corsair OAuth URL for Gmail with tenant identifier
  const url = await corsair
    .withTenant(session.user.id)
    .gmail({ 
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/corsair/callback/gmail` 
    });

  return redirect(url);
}
