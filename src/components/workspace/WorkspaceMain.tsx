"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HomeCommandBar } from "@/components/composer/HomeCommandBar";
import { GLOBAL_HEADER_HEIGHT } from "@/components/layout/GlobalHeader";
import { useProjectsStore } from "@/stores/projects";
import { useContextStore } from "@/stores/context";
import { cn } from "@/lib/cn";
import { CollectionProjectCard } from "@/components/workspace/CollectionProjectCard";

interface WorkspaceMainProps {
  className?: string;
}

type ProjectFilter = "all" | "draft" | "scheduled" | "published" | "archived";

const filterConfig: { id: ProjectFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "all", label: "All campaigns", icon: () => null },
  { id: "draft", label: "Drafts", icon: PencilFilterIcon },
  { id: "scheduled", label: "In review", icon: ClockFilterIcon },
  { id: "published", label: "Published", icon: CheckCircleFilterIcon },
  { id: "archived", label: "Archived", icon: ArchiveFilterIcon },
];

function filterProjects(projects: typeof import("@/data/mock-projects").mockProjects, filter: ProjectFilter) {
  switch (filter) {
    case "all":
      return projects;
    case "draft":
      return projects.filter((p) => p.status === "draft");
    case "scheduled":
      return projects.filter((p) => p.status === "review");
    case "published":
      return projects.filter((p) => p.status === "approved" || p.status === "published");
    case "archived":
      return projects.filter((p) => p.status === "archived");
    default:
      return projects;
  }
}

export function WorkspaceMain({ className }: WorkspaceMainProps) {
  const { projects } = useProjectsStore();
  const { context, isLoaded, loadContext } = useContextStore();
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoaded) loadContext();
  }, [isLoaded, loadContext]);

  const brandName = context?.brand.name ?? "Brand";

  const collectionCounts = useMemo(
    () => ({
      all: projects.length,
      draft: projects.filter((p) => p.status === "draft").length,
      scheduled: projects.filter((p) => p.status === "review").length,
      published: projects.filter((p) => p.status === "approved" || p.status === "published").length,
      archived: projects.filter((p) => p.status === "archived").length,
    }),
    [projects],
  );

  const filteredProjects = useMemo(
    () => filterProjects(projects, activeFilter),
    [projects, activeFilter],
  );

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredProjects;
    return filteredProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }, [filteredProjects, searchQuery]);

  return (
    <main
      className={cn("flex flex-1 w-full min-h-0", className)}
      style={{ minHeight: `calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)` }}
    >
      <aside
        className={cn(
          "hidden md:flex w-[min(280px,28vw)] shrink-0 flex-col border-r border-[var(--border)]",
          "bg-[var(--surface)] py-6 px-3",
        )}
      >
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Collections
        </p>
        <nav className="flex flex-col gap-0.5">
          {filterConfig.map((f) => {
            const isActive = activeFilter === f.id;
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-[#EBF5FE] text-[#0F8EFF] border border-[#0F8EFF]/25"
                    : "text-[var(--text-primary)] hover:bg-[var(--color-background)] border border-transparent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{f.label}</span>
                <span className="tabular-nums text-[12px] text-[var(--text-muted)]">
                  {collectionCounts[f.id]}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ecebea]">
        <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] bg-[#ecebea]/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <div>
            <h1 className="text-[18px] font-bold text-[var(--text-primary)]">Campaign library</h1>
            <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
              {searchQuery.trim() ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{searchFiltered.length}</span> of{" "}
                  {filteredProjects.length} matching &ldquo;{searchQuery.trim()}&rdquo;
                </>
              ) : activeFilter !== "all" ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{searchFiltered.length}</span> in{" "}
                  {filterConfig.find((f) => f.id === activeFilter)?.label.toLowerCase()}
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{searchFiltered.length}</span> campaigns
                </>
              )}
              {" · "}
              Open a card or use the composer below.
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-2 sm:w-auto sm:min-w-[360px]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="campaign-search">
                Search campaigns
              </label>
              <input
                id="campaign-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns…"
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none",
                  "focus:border-[#0F8EFF] focus:ring-2 focus:ring-[#0F8EFF]/20",
                )}
              />
              <Link
                href="/projects/new"
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-center text-[13px] font-semibold text-white",
                  "hover:bg-neutral-800",
                )}
              >
                New project
              </Link>
            </div>
            <div className="md:hidden">
              <FilterSelectMobile
                value={activeFilter}
                onChange={setActiveFilter}
                counts={collectionCounts}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {searchFiltered.length > 0 ? (
            <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {searchFiltered.map((project) => (
                <CollectionProjectCard key={project.id} project={project} brandName={brandName} />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
              <EmptyStateIcon className="mb-3 h-12 w-12 text-[#DDDBDA]" />
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">No campaigns match</p>
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                Try another search or switch collection in the sidebar.
              </p>
              <Link
                href="/projects/new"
                className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-neutral-800"
              >
                New project
              </Link>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Ask Palette
            </p>
            <HomeCommandBar />
          </div>
        </footer>
      </div>
    </main>
  );
}

function FilterSelectMobile({
  value,
  onChange,
  counts,
}: {
  value: ProjectFilter;
  onChange: (v: ProjectFilter) => void;
  counts: Record<ProjectFilter, number>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectFilter)}
      aria-label="Collection"
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] font-medium",
        "text-[var(--text-primary)] outline-none focus:border-[#0F8EFF]",
      )}
    >
      {filterConfig.map((f) => (
        <option key={f.id} value={f.id}>
          {f.label} ({counts[f.id]})
        </option>
      ))}
    </select>
  );
}

function EmptyStateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function PencilFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function ClockFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArchiveFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
