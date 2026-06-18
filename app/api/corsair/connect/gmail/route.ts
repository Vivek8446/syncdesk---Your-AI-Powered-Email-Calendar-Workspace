import { corsair } from "@/corsair";
import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { generateOAuthUrl } from "corsair/oauth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/corsair/callback/google`;

  try {
    const { url, state } = await generateOAuthUrl(corsair, "gmail", {
      tenantId: session.user.id,
      redirectUri,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Failed to generate Corsair OAuth URL:", error);
    return new NextResponse("Failed to generate Gmail connection link.", { status: 500 });
  }
}
