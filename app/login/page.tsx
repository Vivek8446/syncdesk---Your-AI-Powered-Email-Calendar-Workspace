"use client";

import { useState } from "react";
import { signIn } from "@/app/src/lib/auth-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err?.message || "Failed to initiate Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-zinc-950 font-sans overflow-hidden">
      {/* Decorative background grid and gradients for premium aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f13_1px,transparent_1px),linear-gradient(to_bottom,#0f0f13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Glowing backdrop elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Brand logo / header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <svg
              className="h-6 w-6 text-white"
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
          <h1 className="text-3xl font-bold tracking-tight text-white bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-sm flex gap-2 items-start">
              <svg
                className="h-5 w-5 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white text-zinc-950 font-medium hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-zinc-950"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.87c2.26-2.08 3.56-5.14 3.56-8.7c0-.27-.02-.54-.05-.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.31v3.11c2 3.97 6.11 6.67 10.69 6.67z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.24 14.22c-.25-.72-.39-1.5-.39-2.3c0-.8.14-1.57.39-2.3V6.51H1.31A11.96 11.96 0 000 12c0 1.99.49 3.87 1.31 5.49l3.93-3.27z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.42 0 3.31 2.7 1.31 6.51l3.93 3.11c.95-2.88 3.61-5.01 6.76-5.01z"
                  />
                </svg>
              )}
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <span className="relative z-10 px-3 bg-zinc-900/10 text-xs text-zinc-500 uppercase tracking-widest">
                Secure Authentication
              </span>
            </div>

            <p className="text-center text-xs text-zinc-500 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy. Secure single sign-on provided via Better Auth.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Modern App. All rights reserved.
        </div>
      </div>
    </div>
  );
}
