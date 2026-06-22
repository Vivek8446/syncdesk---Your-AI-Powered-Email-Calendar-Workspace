"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Inbox as InboxIcon,
  Calendar as CalendarIcon,
  MessageSquare,
  Search,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Sparkles,
  Clock,
  ArrowUpRight,
  Mail,
  Check,
  Bell,
  RefreshCw,
  X,
  Tag,
  Users,
  Info,
  Star,
} from "lucide-react";
import { signOut } from "@/app/src/lib/auth-client";
import { Sidebar } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { InboxView } from "./components/InboxView";

// Dynamically import FullCalendar wrapper with SSR disabled
const CalendarWrapper = dynamic(
  () => import("./CalendarWrapper").then((mod) => mod.CalendarWrapper),
  { ssr: false }
);

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date | string;
  };
  gmailConnected: boolean;
  initialMessages: any[];
  fetchError: string | null;
}

export function DashboardClient({
  user,
  gmailConnected,
  initialMessages,
  fetchError,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<string>("inbox");
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Calendar Controls
  const calendarRef = useRef<any>(null);
  const [currentDateText, setCurrentDateText] = useState("May 2024");
  const [calendarView, setCalendarView] = useState("Week"); // Day, Week, Month

  // Chat/Assistant Controls
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 1,
      sender: "user",
      text: "Schedule a meeting with Rahul tomorrow at 5 PM",
      time: "10:42 AM",
    },
    {
      id: 2,
      sender: "assistant",
      text: "I've drafted a meeting with Rahul. Tomorrow at 5:00 PM. Your schedule is clear then.",
      time: "10:42 AM",
      widget: {
        title: "Meeting with Rahul",
        date: "Wed, May 15",
        timeRange: "5:00 PM - 5:30 PM",
        confirmed: false,
      },
    },
  ]);

  // Calendar Events State
  const [calendarEvents, setCalendarEvents] = useState<any[]>([
    {
      id: "1",
      title: "Marketing Sync",
      start: "2024-05-13T10:00:00",
      end: "2024-05-13T11:30:00",
      extendedProps: {
        subtitle: "Google Meet",
        bgClass: "bg-[#89D7B7]/15",
        borderClass: "border-[#89D7B7]",
      },
    },
    {
      id: "2",
      title: "Product Review",
      start: "2024-05-14T13:00:00",
      end: "2024-05-14T14:30:00",
      extendedProps: {
        subtitle: "Main Conference",
        bgClass: "bg-[#428475]/30",
        borderClass: "border-[#89D7B7]/60",
      },
    },
    {
      id: "3",
      title: "Deep Work",
      start: "2024-05-15T11:00:00",
      end: "2024-05-15T12:30:00",
      extendedProps: {
        subtitle: "Focus Zone",
        bgClass: "bg-amber-650/15",
        borderClass: "border-amber-500",
      },
    },
    {
      id: "4",
      title: "DRAFTING MEETING...",
      start: "2024-05-14T17:00:00",
      end: "2024-05-14T18:00:00",
      extendedProps: {
        subtitle: "AI Assistant",
        bgClass: "bg-[#122420]/60 border border-dashed border-[#24453e]",
        borderClass: "border-transparent",
        isDraft: true,
      },
    },
  ]);

  // Inbox Sub-tabs controls
  const [activeSubTab, setActiveSubTab] = useState<"primary" | "promotions" | "social" | "updates">("primary");

  const [emails, setEmails] = useState<Record<string, any[]>>(() => {
    // Initial dynamic messages from Gmail API (or fallback if empty)
    const apiMessages = initialMessages && initialMessages.length > 0
      ? initialMessages.map((m, idx) => ({
        id: m.id || `api-${idx}`,
        from: m.from?.split("<")[0]?.trim() || "Unknown Sender",
        subject: m.subject || "No Subject",
        snippet: m.snippet || "No snippet available",
        date: m.date || "07:16",
        starred: m.starred || false,
        checked: false
      }))
      : [];

    return {
      primary: apiMessages,
      promotions: [],
      social: [],
      updates: []
    };
  });

  // ⭐ Star / Unstar an email via Corsair Gmail API (messages.modify)
  const toggleStar = async (tab: "primary" | "promotions" | "social" | "updates", id: string) => {
    const email = emails[tab].find((e) => e.id === id);
    if (!email) return;
    const currentStarred = email.starred;

    // Optimistic UI update
    setEmails(prev => ({
      ...prev,
      [tab]: prev[tab].map(e => e.id === id ? { ...e, starred: !currentStarred } : e)
    }));

    try {
      const res = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "modify",
          messageId: id,
          addLabelIds: currentStarred ? [] : ["STARRED"],
          removeLabelIds: currentStarred ? ["STARRED"] : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to modify label");
    } catch (err) {
      console.error("Error toggling star:", err);
      // Revert on failure
      setEmails(prev => ({
        ...prev,
        [tab]: prev[tab].map(e => e.id === id ? { ...e, starred: currentStarred } : e)
      }));
    }
  };

  const toggleCheckbox = (tab: "primary" | "promotions" | "social" | "updates", id: string) => {
    setEmails(prev => ({
      ...prev,
      [tab]: prev[tab].map(email => email.id === id ? { ...email, checked: !email.checked } : email)
    }));
  };

  // Fetch emails from the API route
  const fetchEmails = async (tabQuery?: string) => {
    if (!gmailConnected) return;
    setIsLoadingEmails(true);
    try {
      const q = searchQuery || "";
      const tab = tabQuery || "inbox";
      const res = await fetch(`/api/gmail?tab=${tab}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.messages || []).map((m: any) => ({
          id: m.id,
          from: m.from?.split("<")[0]?.trim() || "Unknown",
          subject: m.subject || "No Subject",
          snippet: m.snippet || "",
          date: m.date || "",
          starred: m.starred || false,
          checked: false,
        }));
        setEmails(prev => ({ ...prev, primary: mapped }));
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // Send email via Corsair Gmail API (messages.send)
  const handleSendEmail = async () => {
    if (!composeTo.trim()) {
      alert("Please specify a recipient.");
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          to: composeTo,
          subject: composeSubject,
          bodyText: composeBody,
        }),
      });
      if (res.ok) {
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        setIsComposeOpen(false);
        fetchEmails("inbox");
      } else {
        const errData = await res.json();
        alert(`Send failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send. Check connection.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSignOutLoading(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      window.location.href = "/login";
    } finally {
      setIsSignOutLoading(false);
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
      updateDateText();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
      updateDateText();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
      updateDateText();
    }
  };

  const handleChangeView = (viewType: string) => {
    setCalendarView(viewType);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (viewType === "Day") {
        api.changeView("timeGridDay");
      } else if (viewType === "Week") {
        api.changeView("timeGridWeek");
      } else if (viewType === "Month") {
        api.changeView("dayGridMonth");
      }
      updateDateText();
    }
  };

  const updateDateText = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      setCurrentDateText(api.view.title);
    }
  };

  useEffect(() => {
    // Initial load of title date text
    setTimeout(() => {
      updateDateText();
    }, 100);
  }, []);

  const handleConfirmMeeting = (messageId: number) => {
    // Update the message state to show confirmed
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, widget: { ...msg.widget, confirmed: true } }
          : msg
      )
    );

    // Swap the DRAFTING event on the calendar with the confirmed event
    setCalendarEvents((prev) => [
      ...prev.filter((evt) => evt.id !== "4"), // Remove drafting
      {
        id: "confirmed-rahul",
        title: "Meeting with Rahul",
        start: "2024-05-15T17:00:00",
        end: "2024-05-15T17:30:00",
        extendedProps: {
          subtitle: "Google Meet",
          bgClass: "bg-[#89D7B7]/15",
          borderClass: "border-[#89D7B7]",
        },
      },
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      const replyMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Understood. I will process your request: "${text}". Is there anything else you want to schedule?`,
        time: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, replyMsg]);
    }, 800);
  };

  return (
    <div className="flex h-screen bg-[#1A312C] text-[#FFF4E1] font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onComposeClick={() => setIsComposeOpen(true)}
        user={user}
        onLogout={handleSignOut}
        isLogoutLoading={isSignOutLoading}
      />

      {/* MIDDLE WORKSPACE */}
      <main className="flex-1 bg-[#1A312C] flex flex-col min-w-0 border-r border-[#24453e] relative">
        {/* Background grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#24453e_1px,transparent_1px),linear-gradient(to_bottom,#24453e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* TOP BAR / SEARCH */}
        <header className="h-16 border-b border-[#24453e] flex items-center justify-between px-6 z-10 sticky top-0 bg-[#1A312C]/40 backdrop-blur-md">
          {/* Search Inputs */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#FFF4E1]/50" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchEmails("inbox");
              }}
              className="w-full bg-[#122420]/60 border border-[#2c534b] hover:border-[#24453e] focus:border-[#89D7B7]/50 rounded-xl pl-9 pr-10 py-2 text-xs text-[#FFF4E1] placeholder-[#FFF4E1]/40 outline-none transition-all"
            />
            <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-[#1A312C] border border-[#24453e] text-[8px] font-mono text-[#FFF4E1]/40 tracking-wider">
              ⌘ K
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-9 w-9 rounded-xl hover:bg-[#122420] border border-transparent hover:border-[#2c534b] flex items-center justify-center text-[#FFF4E1]/60 hover:text-white transition-all">
              <Bell className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-xl hover:bg-[#122420] border border-transparent hover:border-[#2c534b] flex items-center justify-center text-[#FFF4E1]/60 hover:text-white transition-all">
              <Clock className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-[#122420] hover:bg-[#24453e] text-xs font-semibold rounded-xl text-[#FFF4E1] border border-[#2c534b] transition-all">
              Upgrade
            </button>
          </div>
        </header>

        {/* WORKSPACE VIEW CONTENT */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col z-10">
          {/* TAB: CALENDAR */}
          {activeTab === "calendar" && (
            <div className="flex-1 flex flex-col h-full space-y-4">
              {/* Calendar Custom Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {currentDateText}
                  </h2>
                  <div className="flex items-center gap-1 bg-[#122420] border border-[#2c534b] p-1 rounded-xl">
                    <button
                      onClick={handlePrev}
                      className="p-1 rounded-lg hover:bg-[#24453e] text-[#FFF4E1]/60 hover:text-white transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-1 rounded-lg hover:bg-[#24453e] text-[#FFF4E1]/60 hover:text-white transition-all"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1.5 bg-[#122420] border border-[#2c534b] hover:bg-[#24453e] text-xs font-semibold rounded-lg text-zinc-200 transition-all"
                  >
                    Today
                  </button>
                </div>

                {/* Day / Week / Month Toggles */}
                <div className="flex p-1 bg-[#122420]/60 border border-[#2c534b] rounded-xl">
                  {["Day", "Week", "Month"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleChangeView(mode)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${calendarView === mode
                        ? "bg-[#1A312C] text-[#89D7B7] border border-[#2c534b]"
                        : "text-[#FFF4E1]/60 hover:text-white"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Calendar Wrapper Grid container */}
              <div className="flex-1 min-h-0 bg-[#122420]/20 border border-[#24453e] rounded-2xl relative overflow-hidden backdrop-blur-xl">
                <CalendarWrapper ref={calendarRef} events={calendarEvents} />
              </div>
            </div>
          )}

          {/* TAB: INBOX */}
          {activeTab === "inbox" && (
            <InboxView
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              emails={emails}
              toggleCheckbox={toggleCheckbox}
              toggleStar={toggleStar}
              fetchEmails={fetchEmails}
              isLoadingEmails={isLoadingEmails}
              gmailConnected={gmailConnected}
            />
          )}

          {/* TAB: ASSISTANT */}
          {activeTab === "assistant" && (
            <div className="flex-1 flex flex-col h-full justify-center items-center text-center">
              <Sparkles className="h-10 w-10 text-[#89D7B7] animate-pulse mb-4" />
              <h3 className="text-lg font-bold text-white">
                SyncDesk AI Workspace
              </h3>
              <p className="text-xs text-[#FFF4E1]/60 max-w-sm mt-1">
                Your AI Assistant is active on the right sidebar. Use it to
                schedule meetings, query logs, or drafts.
              </p>
            </div>
          )}

          {/* TAB: SEARCH */}
          {activeTab === "search" && (
            <div className="flex-1 flex flex-col h-full justify-center items-center text-center">
              <Search className="h-10 w-10 text-[#89D7B7] mb-4" />
              <h3 className="text-lg font-bold text-white">Omnisearch</h3>
              <p className="text-xs text-[#FFF4E1]/60 max-w-sm mt-1">
                Search commands, calendars, settings, and workspace emails.
              </p>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <SettingsPanel user={user} gmailConnected={gmailConnected} />
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR (AI ASSISTANT) */}
      <aside className="w-80 bg-[#122420] border-l border-[#24453e] flex flex-col justify-between p-5 z-20 shrink-0 relative">
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#89D7B7] animate-pulse" />
                AI Assistant
              </h3>
              <p className="text-[10px] text-[#FFF4E1]/50 font-semibold tracking-wider uppercase mt-0.5">
                Optimizing your performance.
              </p>
            </div>

            {/* Chat Stream */}
            <div className="space-y-4 h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-[#FFF4E1]/50 uppercase tracking-wider">
                      {msg.sender === "user" ? "You" : "SyncDesk AI"}
                    </span>
                    <span className="text-[9px] text-[#FFF4E1]/40">{msg.time}</span>
                  </div>

                  {msg.sender === "user" ? (
                    <div className="p-3 bg-[#1A312C] border border-[#24453e] rounded-2xl text-xs text-[#FFF4E1]/90 leading-relaxed text-left">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-[#FFF4E1]/80 leading-relaxed text-left">
                        {msg.text}
                      </div>

                      {msg.widget && (
                        <div className="p-4 bg-[#1A312C]/80 border border-[#24453e] rounded-2xl space-y-3 relative overflow-hidden backdrop-blur-md">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5 text-left">
                              <h4 className="text-xs font-bold text-white">
                                {msg.widget.title}
                              </h4>
                              <p className="text-[10px] text-[#FFF4E1]/65 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {msg.widget.date}
                              </p>
                              <p className="text-[10px] text-[#FFF4E1]/65 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {msg.widget.timeRange}
                              </p>
                            </div>

                            {/* Avatar placeholder */}
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#428475] to-[#89D7B7] flex items-center justify-center text-[10px] font-extrabold text-[#1A312C]">
                              R
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {msg.widget.confirmed ? (
                              <div className="w-full py-2 bg-emerald-500/15 border border-emerald-500/35 text-emerald-350 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" />
                                Confirmed & Synced
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleConfirmMeeting(msg.id)}
                                  className="flex-1 py-2 bg-[#428475] hover:bg-[#89D7B7] hover:text-[#1A312C] text-[#FFF4E1] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                >
                                  Confirm
                                </button>
                                <button className="flex-1 py-2 bg-[#122420] border border-[#2c534b] hover:bg-[#1A312C] text-[#FFF4E1]/80 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all">
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Input & quick pills */}
          <div className="space-y-3 pt-4 border-t border-[#24453e] bg-[#122420]">
            {/* Quick action pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendMessage("Cancel my next meeting")}
                className="px-2.5 py-1 bg-[#1A312C] hover:bg-[#24453e] border border-[#24453e] rounded-lg text-[10px] text-[#FFF4E1]/70 hover:text-white transition-all font-medium"
              >
                "Cancel my next meeting"
              </button>
              <button
                onClick={() => handleSendMessage("Find flight to NYC")}
                className="px-2.5 py-1 bg-[#1A312C] hover:bg-[#24453e] border border-[#24453e] rounded-lg text-[10px] text-[#FFF4E1]/70 hover:text-white transition-all font-medium"
              >
                "Find flight to NYC"
              </button>
            </div>

            {/* Input field */}
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask AI to schedule or search..."
                className="w-full bg-[#1A312C] border border-[#2c534b] hover:border-[#24453e] focus:border-[#89D7B7]/50 rounded-xl pl-4 pr-10 py-3 text-xs text-[#FFF4E1] placeholder-[#FFF4E1]/40 outline-none transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                className="absolute right-2.5 top-2.5 h-7 w-7 rounded-lg bg-[#428475] hover:bg-[#89D7B7] hover:text-[#1A312C] flex items-center justify-center text-white transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* COMPOSE DIALOG MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#122420] border border-[#2c534b] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsComposeOpen(false)}
              className="absolute right-4 top-4 text-[#FFF4E1]/50 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white">New Message</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="To"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="w-full bg-[#1A312C] border border-[#24453e] rounded-xl px-4 py-2.5 text-xs text-[#FFF4E1] placeholder-[#FFF4E1]/45 outline-none focus:border-[#89D7B7]/50 transition-all"
              />
              <input
                type="text"
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full bg-[#1A312C] border border-[#24453e] rounded-xl px-4 py-2.5 text-xs text-[#FFF4E1] placeholder-[#FFF4E1]/45 outline-none focus:border-[#89D7B7]/50 transition-all"
              />
              <textarea
                placeholder="Write your email here..."
                rows={8}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full bg-[#1A312C] border border-[#24453e] rounded-xl px-4 py-2.5 text-xs text-[#FFF4E1] placeholder-[#FFF4E1]/45 outline-none focus:border-[#89D7B7]/50 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setComposeTo("");
                  setComposeSubject("");
                  setComposeBody("");
                  setIsComposeOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#FFF4E1]/70 hover:text-white bg-[#1A312C] border border-[#24453e] hover:bg-[#24453e] transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1A312C] bg-[#89D7B7] hover:bg-[#89D7B7]/80 transition-all disabled:opacity-50"
              >
                {isSendingEmail ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
