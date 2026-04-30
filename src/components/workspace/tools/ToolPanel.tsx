"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { SelectInspectPanel } from "./SelectInspectPanel";
import { GroupEditPanel } from "./GroupEditPanel";
import { ImageEditPanel } from "./ImageEditPanel";
import { LinkPanel } from "./LinkPanel";
import { LanguageSidebarSection } from "../sidebar/LanguageSidebarSection";
import { cn } from "@/lib/cn";

export function ToolPanel() {
  const { activeTool, showContextPanel, imageEditState, pendingGroupEdit } = useToolsStore();
  const { selectedIds, atomicBlocks, groups } = useWorkspaceStore();

  const shouldShow = selectedIds.length > 0 || showContextPanel;

  const imageEditReady =
    activeTool === "image-edit" &&
    Boolean(imageEditState?.blockId) &&
    atomicBlocks.some((b) => b.id === imageEditState?.blockId);
  const groupEditReady =
    activeTool === "group-edit" &&
    Boolean(pendingGroupEdit?.groupId) &&
    groups.some((g) => g.id === pendingGroupEdit?.groupId);
  const linkReady =
    activeTool === "link" && selectedIds.some((id) => atomicBlocks.some((b) => b.id === id));

  const suppressOuterHeader = imageEditReady || groupEditReady || linkReady;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="border-l border-[#DDD]/80 bg-white overflow-hidden flex-shrink-0 flex flex-col"
        >
          {!suppressOuterHeader && (
            <div className="flex items-center justify-between border-b border-[#DDD] px-4 py-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7A7A]">
                {getPanelTitle(activeTool)}
              </h3>
              <ToolBadge tool={activeTool} />
            </div>
          )}

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                {activeTool === "select" && <SelectInspectPanel />}
                {activeTool === "group-edit" && <GroupEditPanel />}
                {activeTool === "image-edit" && <ImageEditPanel />}
                {activeTool === "layout-edit" && <LayoutEditPlaceholder />}
                {activeTool === "language" && <LanguageSidebarSection className="p-4" />}
                {activeTool === "link" && <LinkPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getPanelTitle(tool: string): string {
  const titles: Record<string, string> = {
    select: "Inspector",
    "group-edit": "Group Edit",
    "image-edit": "Image Edit",
    "layout-edit": "Layout",
    language: "Languages",
    link: "Links",
  };
  return titles[tool] || "Tools";
}

function ToolBadge({ tool }: { tool: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    select: { bg: "bg-neutral-100", text: "text-neutral-600" },
    "group-edit": { bg: "bg-violet-50", text: "text-violet-600" },
    "image-edit": { bg: "bg-blue-50", text: "text-blue-600" },
    "layout-edit": { bg: "bg-orange-50", text: "text-orange-600" },
    language: { bg: "bg-cyan-50", text: "text-cyan-600" },
    link: { bg: "bg-emerald-50", text: "text-emerald-600" },
  };

  const c = config[tool] || config.select;

  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[13px] font-medium capitalize", c.bg, c.text)}>
      {tool.replace("-", " ")}
    </span>
  );
}

function LayoutEditPlaceholder() {
  return (
    <div className="p-4 space-y-5">
      <div className="aspect-video rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center border border-orange-100">
        <LayoutIcon className="w-8 h-8 text-orange-300" />
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#7A7A7A] uppercase tracking-wider mb-3">
          Layout Direction
        </p>
        <div className="grid grid-cols-3 gap-2">
          {["Hero Top", "Side by Side", "Text Focus"].map(layout => (
            <button
              key={layout}
              className="p-3 rounded-xl border border-[#DDD] hover:border-[#DDD] hover:bg-neutral-50 transition-all"
            >
              <div className="w-full aspect-square rounded-lg bg-neutral-100 mb-2" />
              <span className="text-[13px] text-neutral-600 font-medium">{layout}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#7A7A7A] uppercase tracking-wider mb-2">
          Channel Preview
        </p>
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          See how this layout adapts across email, web, and mobile channels.
        </p>
      </div>
    </div>
  );
}

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}
