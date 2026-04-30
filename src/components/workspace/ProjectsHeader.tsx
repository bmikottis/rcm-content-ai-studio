"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const navTabs = [
  { id: "home", label: "Home", href: "/" },
  { id: "campaigns", label: "Campaigns", href: "/projects" },
  { id: "content-studio", label: "Content Studio", href: "/projects", active: true },
  { id: "briefs", label: "Briefs", href: "#" },
  { id: "contacts", label: "Contacts", href: "#" },
  { id: "leads", label: "Leads", href: "#" },
  { id: "segments", label: "Segments", href: "#" },
  { id: "content", label: "Content", href: "#" },
  { id: "flows", label: "Flows", href: "#" },
  { id: "analytics", label: "Analytics", href: "#" },
  { id: "profile-explorer", label: "Profile Explorer", href: "#" },
  { id: "consent", label: "Consent", href: "#" },
  { id: "identity", label: "Identity Resolutions", href: "#" },
  { id: "calendar", label: "Marketing Calendar", href: "#" },
];

export function ProjectsHeader() {
  const { isAuthenticated } = useAuthStore();
  const { context } = useContextStore();
  const [searchValue, setSearchValue] = useState("");

  const brandInitial = context?.brand.name.charAt(0) ?? "A";

  return (
    <div className="flex-shrink-0">
      {/* Global Header Bar */}
      <header className="h-12 flex items-center justify-between px-3 bg-[var(--surface)] border-b border-[#DDD]/60">
        {/* Left: Logo */}
        <div className="flex items-center w-[150px]">
          <Link href="/" className="flex items-center">
            <Logo variant="light" className="h-[18px]" />
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-[480px] mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={cn(
                "w-full h-[32px] pl-8 pr-3 rounded-md text-[13px]",
                "bg-[var(--surface-subtle)] border border-[var(--border)]",
                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:border-[#DDD] focus:ring-1 focus:ring-neutral-200",
                "transition-colors",
              )}
            />
          </div>
        </div>

        {/* Right: Icon buttons + Avatar */}
        <div className="flex items-center gap-1.5 justify-end">
          <HeaderIconButton title="Agentforce">
            <AgentIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="Favorites">
            <StarIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="New">
            <PlusIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="Learn">
            <TrailheadIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="Help">
            <QuestionIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="Setup">
            <GearIcon className="w-4 h-4" />
          </HeaderIconButton>
          <HeaderIconButton title="Notifications">
            <BellIcon className="w-4 h-4" />
          </HeaderIconButton>

          {/* Avatar */}
          <button
            className="w-6 h-6 rounded-full bg-[#00ABFB] flex items-center justify-center ml-1"
            title="Account"
          >
            <span className="text-[13px] font-semibold text-white">{brandInitial}</span>
          </button>
        </div>
      </header>

      {/* Global Navigation Bar */}
      <nav className="h-[34px] flex items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-sm overflow-x-auto" style={{ fontFamily: "var(--font-sans)" }}>
        {/* App switcher + name */}
        <div className="flex items-center gap-2.5 h-full pl-3 pr-5 flex-shrink-0">
          <WaffleIcon className="w-[15px] h-[15px] text-[#001E5B]" />
          <span className="text-[14px] font-normal text-[#001E5B] whitespace-nowrap">
            Marketing
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center h-full">
          {navTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative h-full flex items-center px-3 text-[13px] whitespace-nowrap transition-colors",
                tab.active
                  ? "text-[#001E5B] font-medium"
                  : "text-[var(--text-secondary)] hover:text-neutral-700",
              )}
            >
              {tab.label}
              {tab.active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0070D2] rounded-t" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function HeaderIconButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-neutral-700 hover:bg-[var(--surface-active)] transition-colors"
    >
      {children}
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
      <path d="M16 3l2 2-2 2" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrailheadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M12 4l-7 16" />
      <path d="M12 4l7 16" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function WaffleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="currentColor">
      <rect x="0" y="0" width="3.5" height="3.5" rx="0.5" />
      <rect x="5.75" y="0" width="3.5" height="3.5" rx="0.5" />
      <rect x="11.5" y="0" width="3.5" height="3.5" rx="0.5" />
      <rect x="0" y="5.75" width="3.5" height="3.5" rx="0.5" />
      <rect x="5.75" y="5.75" width="3.5" height="3.5" rx="0.5" />
      <rect x="11.5" y="5.75" width="3.5" height="3.5" rx="0.5" />
      <rect x="0" y="11.5" width="3.5" height="3.5" rx="0.5" />
      <rect x="5.75" y="11.5" width="3.5" height="3.5" rx="0.5" />
      <rect x="11.5" y="11.5" width="3.5" height="3.5" rx="0.5" />
    </svg>
  );
}
