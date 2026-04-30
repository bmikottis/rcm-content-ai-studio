"use client";

import { useMemo, useState } from "react";
import type { AtomicBlock, AtomicBlockType } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";

const TYPE_LABEL: Record<AtomicBlockType, string> = {
  section: "Section",
  image: "Image",
  headline: "Heading",
  body: "Text Block",
  cta: "Button",
  disclaimer: "Disclaimer",
  token: "Personalization",
  divider: "Divider",
  language: "Language",
};

function rowLabel(block: AtomicBlock) {
  if (block.type === "headline" || block.type === "body" || block.type === "cta") {
    const t = block.content?.trim();
    if (t) return t.length > 48 ? `${t.slice(0, 46)}…` : t;
  }
  return block.content?.trim() || TYPE_LABEL[block.type];
}

export function AssetsPanel() {
  const atomicBlocks = useWorkspaceStore((s) => s.atomicBlocks);
  const exitChannel = useWorkspaceStore((s) => s.exitChannel);
  const select = useWorkspaceStore((s) => s.select);
  const focusViewportOnBlock = useWorkspaceStore((s) => s.focusViewportOnBlock);
  const openInspectorBlockDetail = useToolsStore((s) => s.openInspectorBlockDetail);

  const typesPresent = useMemo(() => {
    const s = new Set<AtomicBlockType>();
    for (const b of atomicBlocks) s.add(b.type);
    return Array.from(s).sort();
  }, [atomicBlocks]);

  const [typeFilter, setTypeFilter] = useState<AtomicBlockType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredByType = useMemo(() => {
    if (typeFilter === "all") return atomicBlocks;
    return atomicBlocks.filter((b) => b.type === typeFilter);
  }, [atomicBlocks, typeFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByType;
    return filteredByType.filter((b) => {
      const label = rowLabel(b).toLowerCase();
      const typeName = TYPE_LABEL[b.type].toLowerCase();
      return label.includes(q) || typeName.includes(q) || b.type.toLowerCase().includes(q);
    });
  }, [filteredByType, searchQuery]);

  const onPick = (blockId: string) => {
    exitChannel();
    select([blockId]);
    openInspectorBlockDetail(blockId);
    focusViewportOnBlock(blockId);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="px-3 pt-2.5 pb-2 border-b border-[#DDD] shrink-0 space-y-2">
        <div className="relative">
          <SearchGlyph className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7A7A] pointer-events-none" />
          <input
            type="search"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-2.5 rounded-lg bg-neutral-50 border border-[#DDD] text-[13px] text-neutral-800 placeholder:text-[#7A7A7A] focus:outline-none focus:border-sky-300"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <label
            htmlFor="assets-type-filter"
            className="text-[13px] font-medium text-neutral-500 shrink-0 w-[4.5rem]"
          >
            Type
          </label>
          <select
            id="assets-type-filter"
            value={typeFilter}
            onChange={(e) => {
              const v = e.target.value;
              setTypeFilter(v === "all" ? "all" : (v as AtomicBlockType));
            }}
            className="min-w-0 flex-1 h-8 rounded-lg border border-[#DDD] bg-neutral-50 text-[13px] text-neutral-800 px-2.5 focus:outline-none focus:border-sky-300"
          >
            <option value="all">All types</option>
            {typesPresent.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1 p-3 pt-2 pr-3.5">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-[#7A7A7A] text-center py-6">
            {filteredByType.length === 0
              ? "No elements for this type."
              : "No assets match your search."}
          </p>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onPick(b.id)}
              className="w-full text-left rounded-lg border border-[#DDD] px-2.5 py-2 hover:bg-neutral-50 transition-colors"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] block mb-0.5">
                {TYPE_LABEL[b.type]}
              </span>
              <span className="text-[13px] text-neutral-800 line-clamp-2">{rowLabel(b)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
