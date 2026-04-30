"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectsStore } from "@/stores/projects";
import { formatRelativeTime } from "@/data/mock-projects";
import { ProjectStatus } from "@/types/project";
import { cn } from "@/lib/cn";

interface WorkspaceSidebarProps {
  className?: string;
}

type TabType = "projects" | "shared";

const statusColors: Record<ProjectStatus, string> = {
  draft: "bg-neutral-400",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
  approved: "bg-emerald-500",
  published: "bg-violet-500",
  archived: "bg-neutral-500",
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  review: "Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export function WorkspaceSidebar({ className }: WorkspaceSidebarProps) {
  const { projects } = useProjectsStore();
  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedProjects = [...projects].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  const filteredProjects = sortedProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "w-[320px] flex-shrink-0 h-screen sticky top-0",
        "bg-[var(--surface)] border-r border-[#DDD]/80",
        "flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-small text-[var(--text-primary)]">
            My Projects
          </h2>
          <Link
            href="/projects/new"
            className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-9 pl-9 pr-3 rounded-lg",
              "bg-[var(--surface-subtle)] border border-[var(--border)]",
              "text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[#00A1E0] focus:bg-white",
              "transition-all duration-150"
            )}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex gap-1 p-1 bg-[var(--surface-active)] rounded-lg">
          <button
            onClick={() => setActiveTab("projects")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
              activeTab === "projects"
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-neutral-700"
            )}
          >
            My Projects
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
              activeTab === "shared"
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-neutral-700"
            )}
          >
            Shared
          </button>
        </div>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            <div className="space-y-1">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    target="_blank"
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    {/* Thumbnail/Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: getProjectGradient(project.id),
                      }}
                    >
                      <DocumentIcon className="w-4 h-4 text-white/80" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-[13px] font-medium text-[var(--text-primary)] truncate group-hover:text-[#00A1E0] transition-colors">
                          {project.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            statusColors[project.status]
                          )}
                        />
                        <span className="text-[13px] text-[var(--text-muted)]">
                          {statusLabels[project.status]}
                        </span>
                        <span className="text-[13px] text-neutral-300">·</span>
                        <span className="text-[13px] text-[var(--text-muted)]">
                          {formatRelativeTime(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-active)] flex items-center justify-center mb-3">
                <FolderIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-1">
                {searchQuery ? "No matching projects" : "No projects yet"}
              </p>
              <p className="text-[13px] text-[var(--text-muted)]">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first campaign"}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border)] bg-neutral-50/50">
        <div className="flex items-center justify-between text-[13px] text-[var(--text-muted)]">
          <span>{projects.length} projects</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {projects.filter((p) => p.status === "review").length} in review
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {projects.filter((p) => p.status === "approved").length} ready
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function getProjectGradient(id: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #00A1E0 0%, #6B5ACC 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];
  const index = id.charCodeAt(id.length - 1) % gradients.length;
  return gradients[index];
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
