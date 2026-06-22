"use server";

import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { corsair } from "@/corsair";
import { revalidatePath } from "next/cache";

export async function starMessage(messageId: string, removeStar: boolean = false) {
  try {
    // 1. Authenticate the active user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized access");
    }

    const userId = session.user.id;

    console.log(`${removeStar ? '❌ Unstar' : '⭐ Star'} Request: Message ${messageId} for user ${userId}`);

    // 2. Modify the email by adding or removing the 'STARRED' system label
    // Note: Corsair's auto-generated types might expect an empty array instead of undefined
    const tenant = (corsair as any).withTenant(userId);
    
    await tenant.gmail.api.messages.modify({
      id: messageId,
      addLabelIds: removeStar ? [] : ["STARRED"],
      removeLabelIds: removeStar ? ["STARRED"] : [],
    });

    // 3. Refresh the dashboard path data dynamically
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to star/unstar message:", error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
