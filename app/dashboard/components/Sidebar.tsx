"use client";

import React from "react";
import {
  Inbox as InboxIcon,
  Calendar as CalendarIcon,
  MessageSquare,
  Search,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onComposeClick: () => void;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  onLogout: () => void;
  isLogoutLoading: boolean;
}

const navItems = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "assistant", label: "Assistant", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeTab,
  setActiveTab,
  onComposeClick,
  user,
  onLogout,
  isLogoutLoading,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#122420] border-r border-[#24453e] flex flex-col justify-between p-4 z-20 shrink-0">
      <div className="space-y-6">
        {/* Logo */}
        <div className="px-2 py-3">
          <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
            SyncDesk
          </h1>
          <p className="text-[10px] text-[#89D7B7] tracking-wider font-semibold uppercase mt-0.5">
            AI Command Center
          </p>
        </div>

        {/* Compose */}
        <button
          onClick={onComposeClick}
          className="w-full py-3 px-4 bg-[#428475] hover:bg-[#89D7B7] hover:text-[#1A312C] text-[#FFF4E1] font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-250 active:scale-[0.98] shadow-md shadow-[#89D7B7]/10"
        >
          <Plus className="h-4 w-4" />
          Compose
        </button>

        {/* Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                activeTab === item.id
                  ? "bg-[#24453e] text-[#89D7B7] border border-[#2c534b]"
                  : "text-[#FFF4E1]/70 hover:text-white hover:bg-[#24453e]/40"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="space-y-4 pt-4 border-t border-[#24453e]">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#FFF4E1]/70 hover:text-white rounded-xl transition-all">
          <HelpCircle className="h-4.5 w-4.5" />
          Help
        </button>

        <button
          onClick={onLogout}
          disabled={isLogoutLoading}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#FFF4E1]/70 hover:text-red-400 rounded-xl transition-all disabled:opacity-50"
        >
          <LogOut className="h-4.5 w-4.5" />
          {isLogoutLoading ? "Logging out..." : "Logout"}
        </button>

        {/* User Block */}
        <div className="flex items-center gap-3 px-2 py-3 bg-[#1A312C]/60 border border-[#24453e] rounded-2xl">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover border border-[#24453e]"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#428475] to-[#89D7B7] flex items-center justify-center text-sm font-bold text-[#1A312C] uppercase">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#FFF4E1] truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-[#89D7B7] font-medium truncate mt-0.5">
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
