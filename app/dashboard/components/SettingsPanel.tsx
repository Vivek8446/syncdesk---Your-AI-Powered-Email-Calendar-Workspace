"use client";

import React from "react";
import { RefreshCw, Mail, Check } from "lucide-react";

interface SettingsPanelProps {
  user: {
    id: string;
    email: string;
  };
  gmailConnected: boolean;
}

export function SettingsPanel({ user, gmailConnected }: SettingsPanelProps) {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Settings
        </h2>
        <p className="text-xs text-[#FFF4E1]/60 mt-0.5">
          Manage integrations, keys, and security preferences.
        </p>
      </div>

      {/* Integrations settings list */}
      <div className="bg-[#122420]/30 border border-[#24453e] rounded-3xl p-6 space-y-6 backdrop-blur-xl">
        <h3 className="font-bold text-sm text-white border-b border-[#24453e] pb-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-[#89D7B7]" />
          Integration Status
        </h3>

        <div className="flex items-center justify-between p-4 bg-[#1A312C]/60 border border-[#24453e] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#122420] flex items-center justify-center text-[#FFF4E1]/70 border border-[#2c534b]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#FFF4E1]">
                Google Gmail API
              </h4>
              <p className="text-[10px] text-[#FFF4E1]/50 mt-0.5">
                {gmailConnected
                  ? "Credentials synced & active"
                  : "Connection setup required"}
              </p>
            </div>
          </div>

          {!gmailConnected ? (
            <a
              href="/api/corsair/connect/gmail"
              className="px-4 py-2 bg-[#428475] hover:bg-[#89D7B7] hover:text-[#1A312C] text-xs font-semibold rounded-xl text-white transition-all"
            >
              Connect Gmail
            </a>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
              <Check className="h-3 w-3" />
              Connected
            </div>
          )}
        </div>
      </div>

      {/* Developer credentials check */}
      <div className="bg-[#122420]/30 border border-[#24453e] rounded-3xl p-6 space-y-4 backdrop-blur-xl">
        <h3 className="font-bold text-sm text-white">Developer Info</h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-[#24453e]">
            <span className="text-[#FFF4E1]/60">User Session ID</span>
            <span className="font-mono text-[#FFF4E1]/85">{user.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#24453e]">
            <span className="text-[#FFF4E1]/60">Email Address</span>
            <span className="text-[#FFF4E1]/85">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
