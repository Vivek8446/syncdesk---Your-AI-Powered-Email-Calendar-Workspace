import { corsair } from "@/corsair";
import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const tenantCorsair = corsair.withTenant(session.user.id);

  try {
    // 1. Try to fetch messages
    //@ts-ignore
    const messages = await tenantCorsair.gmail.api.messages.list({
      includeSpamTrash: true,
      maxResults: 5,
    });
    return NextResponse.json({ messages });

  } catch (error: any) {
    // 2. Catch the empty rows error and kick off Corsair's linking process
    if (error.message?.includes("Account not found") || error.status === 404) {
      
    //   const connectUrl = await corsair.getAuthorizationUrl({
    //     tenantId: session.user.id, // Maps to your "QzR34a83..." ID
    //     integrationName: "gmail",
    //     redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`, 
    //   });

      // Redirect the user to connect their Gmail specifically to Corsair
    //   return redirect(connectUrl);
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}