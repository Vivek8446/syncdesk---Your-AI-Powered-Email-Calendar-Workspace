import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/corsair";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    const response = new NextResponse("Missing code or state.", { status: 400 });
    response.cookies.delete("oauth_state");
    return response;
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    const response = new NextResponse("Invalid state / CSRF check failed.", { status: 400 });
    response.cookies.delete("oauth_state");
    return response;
  }

  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/corsair/callback/google`;

  try {
    // Process callback: exchanges code for tokens and saves them under the tenant ID
    await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    const redirectUrl = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("Corsair OAuth Callback processing failed:", error);
    const response = new NextResponse("OAuth failed to register integration", { status: 500 });
    response.cookies.delete("oauth_state");
    return response;
  }
}