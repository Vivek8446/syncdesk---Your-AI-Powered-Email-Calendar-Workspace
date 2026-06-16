import { auth } from "@/app/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative glowing shapes */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <svg
                className="h-4.5 w-4.5 text-white"
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
            <span className="font-semibold text-base tracking-tight text-white">
              Security Console
            </span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider mb-2">
            Powered by Better Auth
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 leading-tight">
            Secure, Agentic Integrations
            <br />
            For Next-Gen Teams
          </h1>
          <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Experience premium, server-protected routes with Google single sign-on. Fully integrated with Drizzle ORM and Neon PostgreSQL databases.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 font-semibold rounded-2xl shadow-lg shadow-white/5 hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 text-center"
          >
            Get Started Free
          </Link>
          <a
            href="https://github.com/better-auth/better-auth"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-zinc-300 hover:text-white font-semibold rounded-2xl border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-850 active:scale-[0.98] transition-all duration-200 text-center"
          >
            Documentation
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-3xl mx-auto w-full text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-850 backdrop-blur-sm space-y-2">
            <h3 className="text-zinc-200 font-bold">Google Auth</h3>
            <p className="text-sm text-zinc-500">
              Modern OAuth workflow utilizing Better Auth Client and backend handler callbacks.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-850 backdrop-blur-sm space-y-2">
            <h3 className="text-zinc-200 font-bold">Server-Side Security</h3>
            <p className="text-sm text-zinc-500">
              Instant routing control checking sessions directly inside React Server Components.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-850 backdrop-blur-sm space-y-2">
            <h3 className="text-zinc-200 font-bold">Drizzle & Neon</h3>
            <p className="text-sm text-zinc-500">
              Fully normalized relational tables mapped for sessions, accounts, and permissions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; {new Date().getFullYear()} Modern App. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
