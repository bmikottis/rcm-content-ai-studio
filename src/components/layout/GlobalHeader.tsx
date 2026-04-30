"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TOP_ROW_HEIGHT = 64;
const NAV_ROW_HEIGHT = 32;
export const GLOBAL_HEADER_HEIGHT = TOP_ROW_HEIGHT + NAV_ROW_HEIGHT;

const imgSearchIcon = "https://www.figma.com/api/mcp/asset/ffda90da-8940-4ca6-a78b-282d2359e865";
const imgChevronDown = "https://www.figma.com/api/mcp/asset/a5b44093-de83-4c1e-93c8-f78473c5671d";
const imgAgentforce = "https://www.figma.com/api/mcp/asset/90338629-368a-4d80-87cf-9a4066c7ac7a";
const imgFavorite = "https://www.figma.com/api/mcp/asset/2efb1f65-ede3-41aa-b3a0-dbd6377eeeea";
const imgNew = "https://www.figma.com/api/mcp/asset/e6ecf631-88a8-4d77-8ede-1bb62bd88559";
const imgTrailhead = "https://www.figma.com/api/mcp/asset/93d2de32-5d97-4e35-aa7d-997dd69daf03";
const imgQuestion = "https://www.figma.com/api/mcp/asset/903d5a9c-da65-42d5-b940-6029d8990742";
const imgSetup = "https://www.figma.com/api/mcp/asset/afad67e9-30d7-40b5-a237-46d3c6135b91";
const imgNotification = "https://www.figma.com/api/mcp/asset/72a83d1d-442d-4468-bfab-18d53287b8a3";
const imgAvatar = "https://www.figma.com/api/mcp/asset/b5d971b6-9d8b-445e-af99-2291eb13017d";
const imgTabChevron = "https://www.figma.com/api/mcp/asset/eb37c355-1ede-444d-92cd-5961bcec7832";
const imgPencil = "https://www.figma.com/api/mcp/asset/e40f431a-81ac-4391-962b-d9fd356ffbd9";

const navTabs: { id: string; label: string; href: string; hasChevron?: boolean; matchPaths?: string[] }[] = [
  { id: "home", label: "Home", href: "#", hasChevron: true },
  { id: "campaigns", label: "Campaigns", href: "#", hasChevron: true },
  { id: "content-studio", label: "Content Studio", href: "/projects", matchPaths: ["/projects", "/projects/new"], hasChevron: true },
  { id: "briefs", label: "Briefs", href: "#", hasChevron: true },
  { id: "contacts", label: "Contacts", href: "#", hasChevron: true },
  { id: "segments", label: "Segments", href: "#", hasChevron: true },
  { id: "flows", label: "Flows", href: "#", hasChevron: true },
  { id: "analytics", label: "Analytics", href: "#", hasChevron: true },
  { id: "calendar", label: "Calendar", href: "#", hasChevron: true },
  { id: "more", label: "More", href: "#", hasChevron: true },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");

  const isTabActive = (tab: typeof navTabs[number]) => {
    if (tab.id === "content-studio") {
      return pathname === "/" || pathname.startsWith("/projects");
    }
    if (tab.matchPaths) {
      return tab.matchPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
    }
    return pathname === tab.href;
  };

  return (
    <div
      className="relative z-[100]"
      style={{ 
        height: GLOBAL_HEADER_HEIGHT,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15), 0 0 2px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* ── Row 1: Global Header (64px) ── */}
      <div
        className="flex items-center justify-between bg-[var(--surface)] px-3"
        style={{ height: TOP_ROW_HEIGHT, minHeight: TOP_ROW_HEIGHT, maxHeight: TOP_ROW_HEIGHT }}
      >
        {/* Logo - Left side (Williams Sonoma only) */}
        <div className="flex items-center px-1 shrink-0 w-[200px]">
          <WilliamsSonomaLogo className="h-[28px] w-auto" />
        </div>

        {/* Center: Search Input (400px wide, 32px tall, 8px radius, 8px gap) */}
        <div className="flex justify-center">
          <div 
            className="bg-[var(--surface)] border border-[#5C5C5C] rounded-lg flex items-center gap-2 px-2 py-0.5 overflow-hidden"
            style={{ width: 400, height: 32, borderRadius: 8 }}
          >
            {/* Search icon - 16px with 2px padding */}
            <div className="flex items-center p-0.5 shrink-0">
              <div className="relative w-4 h-4">
                <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgSearchIcon} />
              </div>
            </div>
            {/* Input text - 13px, line-height 18px */}
            <input
              type="text"
              placeholder="Search…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 h-5 min-w-0 bg-transparent border-none outline-none text-[13px] leading-[18px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', system-ui, sans-serif", fontWeight: 400 }}
            />
            {/* Dropdown chevron - 14px */}
            <div className="flex items-center justify-center shrink-0 w-4 h-4">
              <div className="relative w-3.5 h-3.5">
                <img alt="" className="absolute inset-[27%_14%] w-[72%] h-[46%]" src={imgChevronDown} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Header Icons (gap-4 = 16px) */}
        <div className="flex items-center gap-4 justify-end px-4 shrink-0">
          {/* Agentforce icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="Agentforce">
            <img alt="" className="absolute inset-[6%_4%] w-[92%] h-[88%]" src={imgAgentforce} />
          </button>

          {/* Split Button (Favorites) */}
          <div className="flex items-center shrink-0">
            {/* Main Button - rounded left */}
            <div className="flex items-center overflow-hidden rounded-l-full mr-[-1px]">
              <button className="bg-[var(--surface)] border border-[#5C5C5C] flex items-center justify-center p-[5px] rounded-l-full">
                <div className="relative w-3.5 h-3.5">
                  <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgFavorite} />
                </div>
              </button>
            </div>
            {/* Menu Button - rounded right */}
            <div className="flex items-center overflow-hidden rounded-r-full mr-[-1px]">
              <button className="bg-[var(--surface)] border border-[#5C5C5C] flex items-center justify-center p-[5px] rounded-r-full">
                <div className="relative w-3.5 h-3.5">
                  <img alt="" className="absolute inset-[27%_14%] w-[72%] h-[46%]" src={imgChevronDown} />
                </div>
              </button>
            </div>
          </div>

          {/* New icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="New">
            <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgNew} />
          </button>

          {/* Trailhead icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="Trailhead">
            <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgTrailhead} />
          </button>

          {/* Question icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="Help">
            <img alt="" className="absolute inset-[4%_19%] w-[62%] h-[92%]" src={imgQuestion} />
          </button>

          {/* Setup icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="Setup">
            <img alt="" className="absolute inset-[4%_8%] w-[84%] h-[92%]" src={imgSetup} />
          </button>

          {/* Notification icon - 24px */}
          <button className="relative shrink-0 w-6 h-6" title="Notifications">
            <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgNotification} />
          </button>

          {/* Avatar - 32px */}
          <button className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden" title="Account">
            <img alt="" className="absolute inset-0 w-full h-full object-cover" src={imgAvatar} />
          </button>
        </div>
      </div>

      {/* ── Row 2: Global Navigation (32px) ── */}
      <nav
        className="flex items-center bg-[var(--surface)] overflow-x-auto px-3"
        style={{ height: NAV_ROW_HEIGHT }}
      >
        {/* App Launcher + "Marketing" */}
        <div className="flex items-center gap-2 h-full pr-3 shrink-0 mr-1">
          <WaffleIcon className="w-5 h-5 text-[#001E5B]" />
          <span 
            className="text-[14px] leading-[19px] text-[#001E5B] whitespace-nowrap font-semibold"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', system-ui, sans-serif" }}
          >
            Marketing
          </span>
        </div>

        {/* Tabs - SLDS2 exact style */}
        <div className="flex items-center h-full flex-1">
          {navTabs.map((tab) => {
            const active = isTabActive(tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex flex-col h-[32px] items-start max-w-[320px] shrink-0"
              >
                <div 
                  className={cn(
                    "bg-[var(--surface)] flex gap-2 h-[29px] items-center px-3",
                    active ? "" : "hover:bg-[var(--background)]"
                  )}
                >
                  <div className="flex h-full items-center">
                    <span 
                      className={cn(
                        "text-[14px] leading-[19px] whitespace-nowrap overflow-hidden text-ellipsis font-semibold",
                        active ? "text-[#0176D3]" : "text-[#001E5B]"
                      )}
                      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', system-ui, sans-serif" }}
                    >
                      {tab.label}
                    </span>
                  </div>
                  {tab.hasChevron && (
                    <div className="flex items-center justify-center w-5 h-5 rounded">
                      <div className="w-4 h-4 flex items-center justify-center rounded-lg overflow-hidden">
                        <div className="relative w-3.5 h-3.5">
                          <img alt="" className="absolute inset-[25%_8%] w-[84%] h-[50%]" src={imgTabChevron} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Active indicator - 3px blue bar */}
                <div className="flex flex-col h-[3px] items-start w-full">
                  {active ? (
                    <div className="bg-[#0176D3] h-[3px] w-full" />
                  ) : (
                    <div className="bg-[var(--surface)] h-[3px] w-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Edit/Pencil button - 32px with 14px icon */}
        <button className="flex items-center justify-center h-8 min-w-8 px-2 rounded-full hover:bg-[var(--background)] shrink-0">
          <div className="relative w-3.5 h-3.5">
            <img alt="" className="absolute inset-[4%] w-[92%] h-[92%]" src={imgPencil} />
          </div>
        </button>
      </nav>
    </div>
  );
}

/* ── Icon Components ── */

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

function WilliamsSonomaLogo({ className }: { className?: string }) {
  return (
    <img src="/images/ws/ws-logo.svg" alt="Williams Sonoma" className={className} />
  );
}
