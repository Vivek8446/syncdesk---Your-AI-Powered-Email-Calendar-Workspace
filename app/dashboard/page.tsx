import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { corsair } from "@/corsair";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userId = user.id;

  let gmailConnected = false;
  let messages: any = null;
  let fetchError: string | null = null;

  try {
    // Attempt to fetch Gmail messages server-side using Corsair
    const res = await corsair
      .withTenant(userId)
      .gmail.api.messages.list({ maxResults: 5 });
    
    // If successful, Gmail is connected
    messages = res;
    gmailConnected = true;
  } catch (error: any) {
    console.log("Gmail is not connected or fetch failed:", error?.message || error);
    fetchError = error?.message || String(error);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col relative">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              Security Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-400 font-medium">Session Active</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/30 via-purple-950/10 to-zinc-900/30 border border-indigo-950/30 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user.name}!
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base">
                Manage your credentials, sessions, and connected applications.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-4">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Full Name
                  </span>
                  <p className="text-sm text-zinc-200 font-medium bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-900/50">
                    {user.name}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Email Address
                  </span>
                  <p className="text-sm text-zinc-200 font-medium bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-900/50 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Email Status
                  </span>
                  <div className="flex items-center gap-2 text-sm bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-900/50">
                    {user.emailVerified ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-amber-400 font-medium">Unverified</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Account Created
                  </span>
                  <p className="text-sm text-zinc-200 font-medium bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-900/50">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "long",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Gmail Integration Box */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Gmail Integration
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${gmailConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {gmailConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
              </div>

              {!gmailConnected ? (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-6 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
                  <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-850">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-semibold text-zinc-200">Connect your Gmail</h4>
                    <p className="text-zinc-500 text-xs">
                      Grant read-only access to Gmail to safely sync recent threads and check connectivity.
                    </p>
                  </div>
                  <a
                    href="/api/corsair/connect/gmail"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-md shadow-indigo-650/20 active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    Connect Gmail via Corsair
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Recent Gmail Messages (Corsair API)
                  </h4>
                  <div className="space-y-3">
                    {messages && messages.messages && messages.messages.length > 0 ? (
                      messages.messages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-900/80 hover:border-zinc-800 transition-all duration-150 flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-zinc-300 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                ID: {msg.id.substring(0, 8)}...
                              </span>
                              <span className="text-zinc-500 text-[10px]">
                                Thread: {msg.threadId.substring(0, 8)}...
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 truncate">
                              {msg.snippet || "No snippet description available."}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-zinc-600 shrink-0 mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-sm border border-zinc-850 rounded-xl">
                        No messages found in your inbox.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Better Auth Details (Right Column) */}
          <div className="space-y-8">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-4">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Authentication Info
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Provider</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
                    Google OAuth
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">User ID</span>
                  <span
                    className="font-mono text-zinc-400 text-xs bg-zinc-950/50 px-2 py-1 rounded border border-zinc-900/50 max-w-[150px] truncate"
                    title={user.id}
                  >
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Platform</span>
                  <span className="text-zinc-300 text-xs font-semibold">Better Auth v1</span>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900 text-center">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Session data securely synced through Neon Serverless Postgres adapter.
                </p>
              </div>
            </div>

            {/* Integration Tips */}
            <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/10 border border-zinc-900 rounded-3xl p-8 space-y-4">
              <h4 className="font-bold text-zinc-200 text-sm">Corsair Multi-Tenancy</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Corsair encrypts user keys using a Data Encryption Key (DEK) backed by your Key Encryption Key (KEK).
                This ensures Gmail access is securely scoped to your session user ID (`{userId.substring(0,8)}...`).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
