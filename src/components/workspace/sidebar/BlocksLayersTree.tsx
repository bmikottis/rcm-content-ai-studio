"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AtomicBlock, AtomicBlockType, ChannelType, ContentGroup } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { cn } from "@/lib/cn";

const CHANNEL_LABEL: Record<ChannelType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  rcs: "RCS",
  web: "Web",
};

const FRAGMENT_LABEL: Record<AtomicBlockType, string> = {
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

function channelRowLabel(ch: { channel: ChannelType; displayName?: string }) {
  return ch.displayName?.trim() || CHANNEL_LABEL[ch.channel];
}

function fragmentLabel(block: AtomicBlock) {
  const typeName = FRAGMENT_LABEL[block.type] || block.type;
  if (block.type === "headline" || block.type === "body" || block.type === "cta") {
    const t = block.content?.trim();
    if (t) return t.length > 42 ? `${t.slice(0, 40)}…` : t;
  }
  if (block.type === "image") return block.content || typeName;
  return typeName;
}

/** Groups matching these names start expanded in the tree; all others start collapsed. */
const DEFAULT_EXPANDED_GROUP_NAMES = new Set(["Launch Sequence", "Follow-up Sequence"]);

function defaultCollapsedGroupIds(groupList: ContentGroup[]): Set<string> {
  return new Set(
    groupList.filter((g) => !DEFAULT_EXPANDED_GROUP_NAMES.has(g.name)).map((g) => g.id),
  );
}

/** Channel row keys `${groupId}/${channelId}` in the set are collapsed — default all channels collapsed. */
function defaultCollapsedChannelKeys(groupList: ContentGroup[]): Set<string> {
  const next = new Set<string>();
  for (const g of groupList) {
    for (const ch of g.channels) {
      next.add(`${g.id}/${ch.id}`);
    }
  }
  return next;
}

type MenuTarget =
  | { kind: "group"; group: ContentGroup }
  | { kind: "channel"; groupId: string; channelId: string }
  | { kind: "fragment"; groupId: string; channelId: string; block: AtomicBlock };

type RenameState =
  | { kind: "group"; groupId: string; initial: string }
  | { kind: "channel"; groupId: string; channelId: string; initial: string }
  | { kind: "fragment"; blockId: string; initial: string };

interface BlocksLayersTreeProps {
  searchQuery: string;
}

export function BlocksLayersTree({ searchQuery }: BlocksLayersTreeProps) {
  const groups = useWorkspaceStore((s) => s.groups);
  const atomicBlocks = useWorkspaceStore((s) => s.atomicBlocks);
  const selectedIds = useWorkspaceStore((s) => s.selectedIds);
  const drillInChannel = useWorkspaceStore((s) => s.drillInChannel);

  const enterChannel = useWorkspaceStore((s) => s.enterChannel);
  const exitChannel = useWorkspaceStore((s) => s.exitChannel);
  const select = useWorkspaceStore((s) => s.select);
  const selectAtomicFromLayersPanel = useWorkspaceStore((s) => s.selectAtomicFromLayersPanel);
  const layersPanelAnchor = useWorkspaceStore((s) => s.layersPanelAnchor);
  const updateGroup = useWorkspaceStore((s) => s.updateGroup);
  const updateChannel = useWorkspaceStore((s) => s.updateChannel);
  const updateAtomicBlock = useWorkspaceStore((s) => s.updateAtomicBlock);
  const removeAtomicBlock = useWorkspaceStore((s) => s.removeAtomicBlock);
  const removeChannel = useWorkspaceStore((s) => s.removeChannel);
  const removeGroup = useWorkspaceStore((s) => s.removeGroup);
  const duplicateGroup = useWorkspaceStore((s) => s.duplicateGroup);
  const duplicateChannel = useWorkspaceStore((s) => s.duplicateChannel);
  const duplicateAtomicBlockInChannel = useWorkspaceStore(
    (s) => s.duplicateAtomicBlockInChannel,
  );
  const focusViewportOnGroup = useWorkspaceStore((s) => s.focusViewportOnGroup);

  const openInspectorBlockDetail = useToolsStore((s) => s.openInspectorBlockDetail);
  const openInspectorGroupDetail = useToolsStore((s) => s.openInspectorGroupDetail);

  const blockMap = useMemo(
    () => new Map(atomicBlocks.map((b) => [b.id, b])),
    [atomicBlocks],
  );

  const q = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => {
        const gMatch = g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q);
        const channels = g.channels
          .map((ch) => {
            const chLabel = channelRowLabel(ch).toLowerCase();
            const chMatch = chLabel.includes(q);
            const blocks = ch.atomicBlocks
              .map((id) => blockMap.get(id))
              .filter(Boolean) as AtomicBlock[];
            const fragMatches = blocks.filter((b) => {
              const lab = fragmentLabel(b).toLowerCase();
              return lab.includes(q) || b.type.toLowerCase().includes(q);
            });
            if (!chMatch && fragMatches.length === 0) return null;
            if (!chMatch && fragMatches.length > 0) {
              return { ...ch, atomicBlocks: fragMatches.map((b) => b.id) };
            }
            return ch;
          })
          .filter(Boolean) as typeof g.channels;
        if (!gMatch && channels.length === 0) return null;
        return { ...g, channels };
      })
      .filter(Boolean) as ContentGroup[];
  }, [groups, blockMap, q]);

  /** Group ids in the set are collapsed. Launch / Follow-up sequence groups start expanded. */
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() =>
    defaultCollapsedGroupIds(groups),
  );
  const [collapsedChannels, setCollapsedChannels] = useState<Set<string>>(() =>
    defaultCollapsedChannelKeys(groups),
  );

  const didSyncCollapseAfterEmptyLoad = useRef(false);
  useLayoutEffect(() => {
    if (groups.length === 0 || didSyncCollapseAfterEmptyLoad.current) return;
    setCollapsedGroups(defaultCollapsedGroupIds(groups));
    setCollapsedChannels(defaultCollapsedChannelKeys(groups));
    didSyncCollapseAfterEmptyLoad.current = true;
  }, [groups]);

  const [menu, setMenu] = useState<{ x: number; y: number; target: MenuTarget } | null>(null);
  const [rename, setRename] = useState<RenameState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    const onScroll = () => setMenu(null);
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    const t = window.setTimeout(() => document.addEventListener("pointerdown", onPointer), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChannel = (key: string) => {
    setCollapsedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onGroupActivate = useCallback(
    (group: ContentGroup) => {
      exitChannel();
      select([group.id]);
      openInspectorGroupDetail(group.id);
      focusViewportOnGroup(group.id);
    },
    [exitChannel, select, openInspectorGroupDetail, focusViewportOnGroup],
  );

  const onChannelActivate = useCallback(
    (groupId: string, channelId: string) => {
      enterChannel(groupId, channelId);
    },
    [enterChannel],
  );

  const onFragmentActivate = useCallback(
    (groupId: string, channelId: string, blockId: string) => {
      const d = useWorkspaceStore.getState().drillInChannel;
      if (!d || d.groupId !== groupId || d.channelId !== channelId) {
        enterChannel(groupId, channelId);
      }
      selectAtomicFromLayersPanel(groupId, channelId, blockId);
      openInspectorBlockDetail(blockId);
    },
    [enterChannel, selectAtomicFromLayersPanel, openInspectorBlockDetail],
  );

  const openMenu = (e: React.MouseEvent, target: MenuTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, target });
  };

  const applyRename = (value: string) => {
    if (!rename) return;
    const v = value.trim();
    if (!v) {
      setRename(null);
      return;
    }
    if (rename.kind === "group") updateGroup(rename.groupId, { name: v });
    else if (rename.kind === "channel")
      updateChannel(rename.groupId, rename.channelId, { displayName: v });
    else updateAtomicBlock(rename.blockId, { content: v });
    setRename(null);
  };

  const handleMenuDuplicate = () => {
    if (!menu) return;
    const t = menu.target;
    setMenu(null);
    if (t.kind === "group") {
      const id = duplicateGroup(t.group.id);
      if (id) openInspectorGroupDetail(id);
    } else if (t.kind === "channel") {
      const id = duplicateChannel(t.groupId, t.channelId);
      if (id) enterChannel(t.groupId, id);
    } else {
      const id = duplicateAtomicBlockInChannel(t.groupId, t.channelId, t.block.id);
      if (id) openInspectorBlockDetail(id);
    }
  };

  const handleMenuDelete = () => {
    if (!menu) return;
    const t = menu.target;
    setMenu(null);
    if (t.kind === "group") removeGroup(t.group.id);
    else if (t.kind === "channel") removeChannel(t.groupId, t.channelId);
    else removeAtomicBlock(t.block.id);
  };

  const handleMenuRename = () => {
    if (!menu) return;
    const t = menu.target;
    setMenu(null);
    if (t.kind === "group") setRename({ kind: "group", groupId: t.group.id, initial: t.group.name });
    else if (t.kind === "channel") {
      const g = groups.find((x) => x.id === t.groupId);
      const ch = g?.channels.find((c) => c.id === t.channelId);
      setRename({
        kind: "channel",
        groupId: t.groupId,
        channelId: t.channelId,
        initial: ch ? channelRowLabel(ch) : "",
      });
    } else
      setRename({
        kind: "fragment",
        blockId: t.block.id,
        initial: t.block.content || FRAGMENT_LABEL[t.block.type],
      });
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5 pr-0.5">
        {filteredGroups.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)] px-2 py-4 text-center">No blocks match search.</p>
        ) : (
          filteredGroups.map((group) => {
            const gOpen = !collapsedGroups.has(group.id);
            const groupSelected = selectedIds.includes(group.id);
            return (
              <div key={group.id} className="rounded-lg">
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-md pr-1",
                    groupSelected && !drillInChannel && "bg-sky-50/80",
                  )}
                >
                  <button
                    type="button"
                    aria-label={gOpen ? "Collapse group" : "Expand group"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(group.id);
                    }}
                    className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-neutral-700"
                  >
                    <ChevronRight
                      className={cn("w-3.5 h-3.5 transition-transform", gOpen && "rotate-90")}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onGroupActivate(group)}
                    onContextMenu={(e) => openMenu(e, { kind: "group", group })}
                    className={cn(
                      "flex-1 text-left py-1.5 px-1 rounded-md text-[13px] font-medium min-w-0",
                      groupSelected && !drillInChannel ? "text-sky-900" : "text-neutral-800",
                    )}
                  >
                    <span className="truncate block">{group.name}</span>
                  </button>
                </div>

                {gOpen &&
                  group.channels.map((ch) => {
                    const ck = `${group.id}/${ch.id}`;
                    const cOpen = !collapsedChannels.has(ck);
                    const channelActive =
                      drillInChannel?.groupId === group.id && drillInChannel?.channelId === ch.id;
                    return (
                      <div key={ch.id} className="ml-2 border-l border-[var(--border)] pl-1.5">
                        <div
                          className={cn(
                            "flex items-center gap-0.5 rounded-md pr-1",
                            channelActive && "bg-sky-100/60",
                          )}
                        >
                          <button
                            type="button"
                            aria-label={cOpen ? "Collapse channel" : "Expand channel"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChannel(ck);
                            }}
                            className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-active)]"
                          >
                            <ChevronRight
                              className={cn(
                                "w-3.5 h-3.5 transition-transform",
                                cOpen && "rotate-90",
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => onChannelActivate(group.id, ch.id)}
                            onContextMenu={(e) =>
                              openMenu(e, { kind: "channel", groupId: group.id, channelId: ch.id })
                            }
                            className={cn(
                              "flex-1 text-left py-1 px-1 rounded-md text-[13px] font-medium min-w-0",
                              channelActive ? "text-sky-800" : "text-[var(--text-secondary)]",
                            )}
                          >
                            <span className="truncate block">{channelRowLabel(ch)}</span>
                          </button>
                        </div>

                        {cOpen &&
                          ch.atomicBlocks.map((bid) => {
                            const block = blockMap.get(bid);
                            if (!block) return null;
                            const blockSelected = selectedIds.includes(block.id);
                            const isPrimaryRow =
                              blockSelected &&
                              (!layersPanelAnchor ||
                                (layersPanelAnchor.blockId === block.id &&
                                  layersPanelAnchor.groupId === group.id &&
                                  layersPanelAnchor.channelId === ch.id));
                            const isLinkedRow = blockSelected && !isPrimaryRow;
                            return (
                              <button
                                key={bid}
                                type="button"
                                onClick={() => onFragmentActivate(group.id, ch.id, block.id)}
                                onContextMenu={(e) =>
                                  openMenu(e, {
                                    kind: "fragment",
                                    groupId: group.id,
                                    channelId: ch.id,
                                    block,
                                  })
                                }
                                className={cn(
                                  "w-full text-left py-1.5 px-2 ml-3 rounded-md text-[13px] mb-0.5 truncate transition-colors border",
                                  isPrimaryRow &&
                                    "border-transparent bg-[#00A1E0] font-medium text-white shadow-sm",
                                  isLinkedRow &&
                                    "border-dashed border-[#00A1E0] bg-sky-50/50 font-medium text-[var(--text-secondary)]",
                                  !blockSelected &&
                                    "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-active)]",
                                )}
                              >
                                {fragmentLabel(block)}
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[200] min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            onClick={handleMenuRename}
          >
            Rename…
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            onClick={handleMenuDuplicate}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
            onClick={handleMenuDelete}
          >
            Delete
          </button>
        </div>
      )}

      {rename && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/20 p-4"
          onMouseDown={() => setRename(null)}
        >
          <div
            className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl p-4 w-full max-w-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Rename</p>
            <RenameField
              initial={rename.initial}
              onSave={applyRename}
              onCancel={() => setRename(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RenameField({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] mb-3 focus:outline-none focus:border-[#00A1E0]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(v);
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(v)}
          className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#00A1E0] rounded-lg hover:opacity-90"
        >
          Save
        </button>
      </div>
    </>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
