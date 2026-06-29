import { corsair } from "@/corsair";
import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// ─── In-memory cache (per user/tab/query, 60s TTL) ──────────────
const emailCache = new Map<string, { data: any[]; nextPageToken: string | null; ts: number }>();
const CACHE_TTL_MS = 60_000;

function getCached(key: string): { data: any[]; nextPageToken: string | null } | null {
  const entry = emailCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    emailCache.delete(key);
    return null;
  }
  return { data: entry.data, nextPageToken: entry.nextPageToken };
}

function setCache(key: string, data: any[], nextPageToken: string | null) {
  emailCache.set(key, { data, nextPageToken, ts: Date.now() });
}

function invalidateCache(userId: string) {
  for (const key of emailCache.keys()) {
    if (key.startsWith(userId)) emailCache.delete(key);
  }
}

/**
 * Gmail API Route Handler
 * 
 * GET  – List messages (with folder/query mapping)
 * POST – Star/Unstar (messages.modify), Send email (messages.send),
 *         Labels CRUD, Drafts operations
 * 
 * All operations use Corsair's tenant-scoped Gmail plugin:
 *   corsair.withTenant(userId).gmail.api.*
 */

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "inbox";
  const userQuery = searchParams.get("q") || "";
  const resource = searchParams.get("resource") || "messages"; // messages | labels | drafts

  const tenant = (corsair as any).withTenant(session.user.id);

  try {
    // ─── Labels list ─────────────────────────────
    if (resource === "labels") {
      const res = await tenant.gmail.api.labels.list({});
      return NextResponse.json({ labels: res.labels || [] });
    }

    // ─── Drafts list ─────────────────────────────
    if (resource === "drafts") {
      const res = await tenant.gmail.api.drafts.list({
        maxResults: 20,
        q: userQuery || undefined,
      });
      return NextResponse.json({ drafts: res.drafts || [] });
    }

    // ─── Check cache before hitting Gmail API ────
    const cacheKey = `${session.user.id}:${tab}:${userQuery}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`⚡ [Gmail CACHE HIT] ${tab} → ${cached.data.length} msgs`);
      return NextResponse.json({ messages: cached.data, nextPageToken: cached.nextPageToken });
    }

    // ─── Messages list (default) ─────────────────
    let listParams: any = { maxResults: 10 };

    if (tab === "starred") {
      listParams.labelIds = ["STARRED"];
      if (userQuery) {
        listParams.q = userQuery;
      }
    } else {
      let baseQuery = "label:INBOX";
      if (tab === "promotions") baseQuery = "category:promotions";
      else if (tab === "social") baseQuery = "category:social";
      else if (tab === "updates") baseQuery = "category:updates";
      else if (tab === "drafts") baseQuery = "label:DRAFT";
      else if (tab === "sent") baseQuery = "label:SENT";
      else if (tab === "spam") baseQuery = "label:SPAM";
      else if (tab === "trash") baseQuery = "label:TRASH";

      listParams.q = userQuery ? `${baseQuery} ${userQuery}` : baseQuery;
    }

    const t0 = Date.now();
    const listRes = await tenant.gmail.api.messages.list(listParams);
    console.log(`📬 [Gmail LIST] ${listRes?.messages?.length ?? 0} IDs in ${Date.now() - t0}ms`);

    let messagesList: any[] = [];
    if (listRes && listRes.messages && listRes.messages.length > 0) {
      // Fetch metadata in parallel (not full body — ~10x lighter)
      const detailedMessagesPromises = listRes.messages.map(async (msg: any) => {
        try {
          const metaMsg = await tenant.gmail.api.messages.get({
            id: msg.id,
            format: "metadata",
          });

          const headersList = metaMsg.payload?.headers || [];
          const subject =
            headersList.find((h: any) => h.name.toLowerCase() === "subject")?.value ||
            "No Subject";
          const from =
            headersList.find((h: any) => h.name.toLowerCase() === "from")?.value ||
            "Unknown Sender";
          const dateHeader =
            headersList.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

          // Format date for display
          let formattedDate = "";
          if (dateHeader) {
            try {
              const d = new Date(dateHeader);
              const now = new Date();
              const isToday = d.toDateString() === now.toDateString();
              if (isToday) {
                formattedDate = d.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else {
                formattedDate = d.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });
              }
            } catch {
              formattedDate = dateHeader;
            }
          }

          const labelIds = metaMsg.labelIds || [];
          const starred = labelIds.includes("STARRED");

          return {
            id: metaMsg.id,
            threadId: metaMsg.threadId,
            snippet: metaMsg.snippet || "",
            subject,
            from,
            date: formattedDate,
            starred,
            labelIds,
          };
        } catch (err) {
          console.error(`Failed to fetch metadata for message ${msg.id}:`, err);
          return null;
        }
      });

      const resolvedMessages = await Promise.all(detailedMessagesPromises);
      messagesList = resolvedMessages.filter((msg) => msg !== null);
    }

    const nextPageToken = listRes?.nextPageToken || null;

    // Store in cache for instant tab switching
    setCache(cacheKey, messagesList, nextPageToken);
    console.log(`✅ [Gmail] ${messagesList.length} msgs ready in ${Date.now() - t0}ms`);

    return NextResponse.json({ messages: messagesList, nextPageToken });
  } catch (error: any) {
    console.error("Gmail GET error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const tenant = (corsair as any).withTenant(session.user.id);

    // ─── messages.modify (Star / Unstar / Label changes) ───
    if (action === "modify") {
      const { messageId, addLabelIds, removeLabelIds } = body;

      const modifyParams: any = { id: messageId };
      if (addLabelIds && addLabelIds.length > 0) {
        modifyParams.addLabelIds = addLabelIds;
      }
      if (removeLabelIds && removeLabelIds.length > 0) {
        modifyParams.removeLabelIds = removeLabelIds;
      }

      const result = await tenant.gmail.api.messages.modify(modifyParams);

      // Invalidate cache so next fetch reflects the label change
      invalidateCache(session.user.id);

      return NextResponse.json({ success: true, message: result });
    }

    // ─── messages.send (RFC 2822 MIME via base64url) ───────
    if (action === "send") {
      const { to, subject, bodyText } = body;
      // Compose RFC 2822 compliant MIME message
      const mimeMessage = [
        `To: ${to}`,
        `Subject: ${subject || "(no subject)"}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        bodyText || "",
      ].join("\n");

      // base64url encode (Gmail requires this, NOT plain base64)
      const base64Raw = Buffer.from(mimeMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const result = await tenant.gmail.api.messages.send({ raw: base64Raw });
      return NextResponse.json({ success: true, message: result });
    }

    // ─── messages.trash ──────────────────────────────────────
    if (action === "trash") {
      const { messageId } = body;
      await tenant.gmail.api.messages.trash({ id: messageId });
      return NextResponse.json({ success: true });
    }

    // ─── messages.untrash ────────────────────────────────────
    if (action === "untrash") {
      const { messageId } = body;
      await tenant.gmail.api.messages.untrash({ id: messageId });
      return NextResponse.json({ success: true });
    }

    // ─── messages.delete [DESTRUCTIVE] ───────────────────────
    if (action === "delete") {
      const { messageId } = body;
      await tenant.gmail.api.messages.delete({ id: messageId });
      return NextResponse.json({ success: true });
    }

    // ─── labels.create ───────────────────────────────────────
    if (action === "labels.create") {
      const { label } = body;
      const result = await tenant.gmail.api.labels.create({ label });
      return NextResponse.json({ success: true, label: result });
    }

    // ─── labels.update ───────────────────────────────────────
    if (action === "labels.update") {
      const { labelId, label } = body;
      const result = await tenant.gmail.api.labels.update({ id: labelId, label });
      return NextResponse.json({ success: true, label: result });
    }

    // ─── labels.delete ───────────────────────────────────────
    if (action === "labels.delete") {
      const { labelId } = body;
      await tenant.gmail.api.labels.delete({ id: labelId });
      return NextResponse.json({ success: true });
    }

    // ─── labels.get ──────────────────────────────────────────
    if (action === "labels.get") {
      const { labelId } = body;
      const result = await tenant.gmail.api.labels.get({ id: labelId });
      return NextResponse.json({ success: true, label: result });
    }

    // ─── drafts.create ───────────────────────────────────────
    if (action === "drafts.create") {
      const { to, subject, bodyText } = body;
      const mimeMessage = [
        `To: ${to || ""}`,
        `Subject: ${subject || ""}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        bodyText || "",
      ].join("\n");

      const base64Raw = Buffer.from(mimeMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const result = await tenant.gmail.api.drafts.create({
        draft: { message: { raw: base64Raw } },
      });
      return NextResponse.json({ success: true, draft: result });
    }

    // ─── drafts.send ─────────────────────────────────────────
    if (action === "drafts.send") {
      const { draftId } = body;
      const result = await tenant.gmail.api.drafts.send({ id: draftId });
      return NextResponse.json({ success: true, message: result });
    }

    // ─── drafts.delete ───────────────────────────────────────
    if (action === "drafts.delete") {
      const { draftId } = body;
      await tenant.gmail.api.drafts.delete({ id: draftId });
      return NextResponse.json({ success: true });
    }

    // ─── drafts.update ───────────────────────────────────────
    if (action === "drafts.update") {
      const { draftId, to, subject, bodyText } = body;
      const mimeMessage = [
        `To: ${to || ""}`,
        `Subject: ${subject || ""}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        bodyText || "",
      ].join("\n");

      const base64Raw = Buffer.from(mimeMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const result = await tenant.gmail.api.drafts.update({
        id: draftId,
        draft: { message: { raw: base64Raw } },
      });
      return NextResponse.json({ success: true, draft: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Gmail POST error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
