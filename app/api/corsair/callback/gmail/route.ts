import { corsair } from "@/corsair";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  await corsair.handleCallback(req);
  return redirect("/dashboard");
}
