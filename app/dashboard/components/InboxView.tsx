"use client";

import React, { useTransition } from "react";
import { Mail, Tag, Users, RefreshCw } from "lucide-react";
import { starMessage } from "@/app/actions/gmail";

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  starred: boolean;
  checked: boolean;
}

interface InboxViewProps {
  activeSubTab: "primary" | "promotions" | "social" | "updates";
  setActiveSubTab: (tab: "primary" | "promotions" | "social" | "updates") => void;
  emails: Record<string, Email[]>;
  toggleCheckbox: (tab: "primary" | "promotions" | "social" | "updates", id: string) => void;
  toggleStar: (tab: "primary" | "promotions" | "social" | "updates", id: string) => Promise<void>;
  fetchEmails: (tab: string) => void;
  isLoadingEmails: boolean;
  gmailConnected: boolean;
}

export function InboxView({
  activeSubTab,
  setActiveSubTab,
  emails,
  toggleCheckbox,
  toggleStar,
  fetchEmails,
  isLoadingEmails,
  gmailConnected,
}: InboxViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full space-y-4 overflow-hidden">
      {/* Inbox Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Inbox</h2>
          <p className="text-xs text-[#FFF4E1]/60 mt-0.5">
            Synced dynamically via Corsair Google Integration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEmails("inbox")}
            disabled={isLoadingEmails}
            className="h-8 w-8 rounded-lg bg-[#122420] border border-[#2c534b] hover:bg-[#24453e] flex items-center justify-center text-[#FFF4E1]/60 hover:text-white transition-all disabled:opacity-50"
            title="Refresh inbox"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingEmails ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-2 text-xs bg-[#122420] border border-[#2c534b] px-3 py-1.5 rounded-xl text-[#FFF4E1]/70">
            <span
              className={`h-2 w-2 rounded-full ${
                gmailConnected ? "bg-emerald-500" : "bg-[#24453e]"
              }`}
            />
            <span>{gmailConnected ? "Gmail Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>

      {/* Gmail Sub-Tabs (Primary, Promotions, Social, Updates) */}
      <div className="border-b border-[#24453e] shrink-0">
        <div className="flex space-x-1 sm:space-x-4">
          {/* Primary Tab */}
          <button
            onClick={() => setActiveSubTab("primary")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === "primary"
                ? "border-[#89D7B7] text-[#89D7B7]"
                : "border-transparent text-[#FFF4E1]/60 hover:text-white"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Primary</span>
          </button>

          {/* Promotions Tab */}
          <button
            onClick={() => setActiveSubTab("promotions")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === "promotions"
                ? "border-[#89D7B7] text-[#89D7B7]"
                : "border-transparent text-[#FFF4E1]/60 hover:text-white"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Promotions</span>
          </button>

          {/* Social Tab */}
          <button
            onClick={() => setActiveSubTab("social")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === "social"
                ? "border-[#89D7B7] text-[#89D7B7]"
                : "border-transparent text-[#FFF4E1]/60 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Social</span>
          </button>

          {/* Updates Tab */}
          <button
            onClick={() => setActiveSubTab("updates")}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === "updates"
                ? "border-[#89D7B7] text-[#89D7B7]"
                : "border-transparent text-[#FFF4E1]/60 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Updates</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider ml-1">
              1 new
            </span>
          </button>
        </div>
      </div>

      {/* Table/List of Emails based on active sub-tab */}
      <div className="flex-1 overflow-y-auto bg-[#122420]/30 border border-[#24453e] rounded-2xl overflow-hidden backdrop-blur-xl custom-scrollbar">
        {emails[activeSubTab] && emails[activeSubTab].length > 0 ? (
          <div className="divide-y divide-[#24453e]/60">
            {emails[activeSubTab].map((email) => (
              <EmailRow 
                key={email.id} 
                email={email} 
                activeSubTab={activeSubTab} 
                toggleCheckbox={toggleCheckbox} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Mail className="h-8 w-8 text-[#FFF4E1]/30 stroke-[1.5] mb-3" />
            <h4 className="font-semibold text-[#FFF4E1]/80">
              No emails found
            </h4>
            <p className="text-[11px] text-[#FFF4E1]/45 max-w-xs mt-1">
              No messages match the {activeSubTab} criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailRow({ 
  email, 
  activeSubTab, 
  toggleCheckbox 
}: { 
  email: Email, 
  activeSubTab: string, 
  toggleCheckbox: (tab: any, id: string) => void 
}) {
  const [isPending, startTransition] = useTransition();

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop row click propagation if navigation is attached
    
    startTransition(async () => {
      // Pass the current toggle state to star/unstar properly
      const result = await starMessage(email.id, email.starred);
      if (result.success) {
        // Optimistic local update is handled by the server revalidatePath("/dashboard")
        // but can optionally be triggered locally here.
      } else {
        alert(`Error starring email: ${result.error}`);
      }
    });
  };

  return (
    <div
      className={`flex items-center px-4 py-3 text-xs transition-all duration-100 hover:bg-[#24453e]/20 group ${
        email.checked ? "bg-[#24453e]/10" : ""
      }`}
    >
      {/* Checkbox Column */}
      <div className="flex items-center justify-center mr-3 shrink-0">
        <input
          type="checkbox"
          checked={email.checked}
          onChange={() => toggleCheckbox(activeSubTab as any, email.id)}
          className="h-3.5 w-3.5 accent-[#89D7B7] border-[#2c534b] bg-transparent rounded cursor-pointer"
        />
      </div>

      {/* Star Column */}
      <button
        onClick={handleStar}
        disabled={isPending}
        className={`p-1 mr-4 shrink-0 transition-all rounded-lg ${
          isPending ? "opacity-50 cursor-wait" : "hover:bg-[#24453e] group"
        }`}
        title="Star this email"
      >
        <svg
          className={`w-4.5 h-4.5 transition-colors ${
            email.starred ? "fill-[#89D7B7] text-[#89D7B7]" : "text-[#FFF4E1]/30 group-hover:text-amber-400"
          }`}
          fill={email.starred ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={email.starred ? 0 : 2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499c.151-.312.596-.312.748 0l2.141 4.43 4.817.697c.345.05.483.473.233.716l-3.486 3.401.82 4.794c.059.344-.302.607-.609.445L12 15.347l-4.344 2.373c-.307.162-.668-.101-.609-.445l.82-4.794L4.383 11.538c-.25-.243-.113-.666.233-.716l4.817-.697 2.141-4.43z"
          />
        </svg>
      </button>

      {/* Sender Column */}
      <div className="w-40 font-bold text-[#FFF4E1] truncate pr-4 shrink-0">
        {email.from}
      </div>

      {/* Subject + Snippet Column */}
      <div className="flex-1 min-w-0 pr-4">
        <span className="font-bold text-[#FFF4E1] mr-1">
          {email.subject}
        </span>
        <span className="text-[#FFF4E1]/50 truncate">
          - {email.snippet}
        </span>
      </div>

      {/* Date Column */}
      <div className="w-20 text-right font-medium text-[#FFF4E1]/50 shrink-0">
        {email.date}
      </div>
    </div>
  );
}
