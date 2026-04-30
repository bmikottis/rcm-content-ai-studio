"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { ImageEditPanel } from "./tools";
import { FragmentPropertyEditor } from "./FragmentPropertyEditor";
import { GroupPropertyEditor } from "./GroupPropertyEditor";
import {
  CtaPropertyPanel,
  SectionPropertyPanel,
  TextPropertyPanel,
  ImagePropertyPanel,
  GroupPropertyPanel,
  ChannelPropertyPanel,
} from "./inspector/DynamicPropertyPanels";
import { SidebarDrillChevron } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

/* ── Type metadata for contextual header ────────────────────────────── */

const BLOCK_TYPE_META: Record<string, { label: string; badge: string; badgeBg: string }> = {
  headline: { label: "Heading", badge: "H", badgeBg: "bg-blue-500" },
  body:     { label: "Body Text", badge: "T", badgeBg: "bg-slate-500" },
  image:    { label: "Image", badge: "I", badgeBg: "bg-purple-500" },
  cta:      { label: "Button", badge: "B", badgeBg: "bg-emerald-500" },
  section:  { label: "Section", badge: "S", badgeBg: "bg-violet-500" },
  divider:  { label: "Divider", badge: "D", badgeBg: "bg-neutral-400" },
  token:    { label: "Token", badge: "K", badgeBg: "bg-orange-500" },
  disclaimer: { label: "Disclaimer", badge: "!", badgeBg: "bg-amber-500" },
  language: { label: "Language", badge: "L", badgeBg: "bg-cyan-500" },
};

export function InspectorPanel() {
  const {
    inspectorDetail,
    closeInspectorDetail,
    openInspectorBlockDetail,
    openInspectorGroupDetail,
  } = useToolsStore();
  const { selectedIds, atomicBlocks, groups, drillInChannel, select } = useWorkspaceStore();
  const hasSelection = selectedIds.length > 0;
  const inChannelDrillOverview =
    Boolean(drillInChannel) &&
    inspectorDetail === null &&
    selectedIds.length === 1 &&
    selectedIds[0] === drillInChannel?.groupId;
  const shouldShow =
    (hasSelection && inspectorDetail !== null) || inChannelDrillOverview;

  const drillBlock =
    inspectorDetail?.type === "block"
      ? atomicBlocks.find((b) => b.id === inspectorDetail.blockId)
      : undefined;
  const drillGroup =
    inspectorDetail?.type === "group"
      ? groups.find((g) => g.id === inspectorDetail.groupId)
      : undefined;
  const drillImageEdit = inspectorDetail?.type === "image-edit";

  const drillChannelData = useMemo(() => {
    if (!drillInChannel) return null;
    const group = groups.find((g) => g.id === drillInChannel.groupId);
    const channel = group?.channels.find((ch) => ch.id === drillInChannel.channelId);
    if (!group || !channel) return null;
    return { group, channel };
  }, [drillInChannel, groups]);

  const channelFragmentDetail = Boolean(
    drillChannelData &&
      drillBlock &&
      inspectorDetail?.type === "block" &&
      drillChannelData.channel.atomicBlocks.includes(drillBlock.id),
  );

  const channelImageEditDetail = Boolean(
    drillChannelData &&
      inspectorDetail?.type === "image-edit" &&
      drillChannelData.channel.atomicBlocks.includes(inspectorDetail.blockId),
  );

  const showChannelPropertyList =
    Boolean(drillChannelData) && !channelFragmentDetail && !channelImageEditDetail;

  const selectedBlock = useMemo(() => {
    if (selectedIds.length !== 1) return undefined;
    return atomicBlocks.find((b) => b.id === selectedIds[0]);
  }, [selectedIds, atomicBlocks]);

  const selectedGroup = useMemo(() => {
    if (selectedIds.length !== 1) return undefined;
    return groups.find((g) => g.id === selectedIds[0]);
  }, [selectedIds, groups]);

  // Derive contextual header info from selection
  const headerMeta = useMemo(() => {
    if (selectedIds.length === 0) return null;
    if (selectedIds.length > 1) return { type: "multi" as const, label: "Properties", subtitle: `${selectedIds.length} elements selected` };
    if (selectedBlock) {
      const meta = BLOCK_TYPE_META[selectedBlock.type];
      return meta
        ? { type: "block" as const, label: meta.label, badge: meta.badge, badgeBg: meta.badgeBg, subtitle: selectedBlock.content }
        : { type: "block" as const, label: selectedBlock.type, badge: "?", badgeBg: "bg-neutral-400", subtitle: selectedBlock.content };
    }
    if (selectedGroup) {
      return { type: "group" as const, label: "Campaign", badge: "G", badgeBg: "bg-blue-500", subtitle: selectedGroup.name };
    }
    return null;
  }, [selectedIds, selectedBlock, selectedGroup]);

  useEffect(() => {
    if (!inspectorDetail) return;
    if (
      (inspectorDetail.type === "block" || inspectorDetail.type === "image-edit") &&
      !atomicBlocks.some((b) => b.id === inspectorDetail.blockId)
    ) {
      closeInspectorDetail();
    }
    if (inspectorDetail.type === "group" && !groups.some((g) => g.id === inspectorDetail.groupId)) {
      closeInspectorDetail();
    }
  }, [inspectorDetail, atomicBlocks, groups, closeInspectorDetail]);

  useEffect(() => {
    if (!inspectorDetail) return;
    if (selectedIds.length !== 1) {
      closeInspectorDetail();
      return;
    }
    const id = selectedIds[0];
    if (inspectorDetail.type === "block") {
      if (!atomicBlocks.some((b) => b.id === id)) {
        closeInspectorDetail();
        return;
      }
      if (id !== inspectorDetail.blockId) {
        openInspectorBlockDetail(id);
      }
    } else if (inspectorDetail.type === "image-edit") {
      if (!atomicBlocks.some((b) => b.id === id)) {
        closeInspectorDetail();
      }
    } else if (inspectorDetail.type === "group") {
      if (!groups.some((g) => g.id === id)) {
        closeInspectorDetail();
        return;
      }
      if (id !== inspectorDetail.groupId) {
        openInspectorGroupDetail(id);
      }
    }
  }, [
    selectedIds,
    atomicBlocks,
    groups,
    inspectorDetail,
    closeInspectorDetail,
    openInspectorBlockDetail,
    openInspectorGroupDetail,
  ]);

  const inDrillIn = Boolean(
    inspectorDetail &&
      ((inspectorDetail.type === "block" && drillBlock) ||
        (inspectorDetail.type === "group" && drillGroup) ||
        drillImageEdit),
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {shouldShow && (
          <motion.div
            key="inspector-body"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-3 top-[4.25rem] bottom-3 flex w-[min(350px,calc(100vw-1.5rem))] flex-col pointer-events-auto"
            style={{ zIndex: "var(--z-panel)" }}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#DDD]/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.16)]">

          {/* ── Contextual panel header ── */}
          {headerMeta && !inDrillIn && !drillChannelData && (
            <div className="shrink-0 border-b border-[#DDD]">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    closeInspectorDetail();
                    useWorkspaceStore.getState().clearSelection();
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
                  aria-label="Close"
                >
                  <SidebarDrillChevron className="h-[16px] w-[16px]" />
                </button>

                {/* Type badge + label */}
                {"badge" in headerMeta && (
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white",
                    headerMeta.badgeBg,
                  )}>
                    {headerMeta.badge}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{headerMeta.label}</p>
                  {headerMeta.subtitle && (
                    <p className="truncate text-[13px] text-[var(--text-secondary)] leading-tight mt-0.5">{headerMeta.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Inspector content ── */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {channelFragmentDetail && drillBlock && drillInChannel && (
                <FragmentPropertyEditor
                  block={drillBlock}
                  key={drillBlock.id}
                  onCloseFragment={() => {
                    closeInspectorDetail();
                    select([drillInChannel.groupId]);
                  }}
                />
              )}

              {channelImageEditDetail && drillInChannel && (
                <ImageEditPanel
                  onClose={() => {
                    closeInspectorDetail();
                    select([drillInChannel.groupId]);
                  }}
                />
              )}

              {showChannelPropertyList && drillChannelData && (
                <div className="flex h-full flex-col overflow-y-auto">
                  <ChannelPropertyPanel
                    channel={drillChannelData.channel}
                    groupName={drillChannelData.group.name}
                    key={drillChannelData.channel.id}
                  />
                </div>
              )}

              {!drillChannelData && inDrillIn && inspectorDetail?.type === "block" && drillBlock && (
                <FragmentPropertyEditor block={drillBlock} key={drillBlock.id} />
              )}
              {!drillChannelData && inDrillIn && inspectorDetail?.type === "group" && drillGroup && (
                <GroupPropertyEditor group={drillGroup} key={drillGroup.id} />
              )}
              {!drillChannelData && inDrillIn && drillImageEdit && <ImageEditPanel />}

              {!drillChannelData && !inDrillIn && hasSelection && (
                <div className="flex h-full flex-col overflow-y-auto">
                  {/* Section block */}
                  {selectedBlock?.type === "section" && (
                    <SectionPropertyPanel block={selectedBlock} key={selectedBlock.id} />
                  )}
                  {/* CTA / Button */}
                  {selectedBlock?.type === "cta" && (
                    <CtaPropertyPanel block={selectedBlock} key={selectedBlock.id} />
                  )}
                  {/* Text: headline / body */}
                  {selectedBlock && (selectedBlock.type === "headline" || selectedBlock.type === "body") && (
                    <TextPropertyPanel block={selectedBlock} key={selectedBlock.id} />
                  )}
                  {/* Image */}
                  {selectedBlock?.type === "image" && (
                    <ImagePropertyPanel block={selectedBlock} key={selectedBlock.id} />
                  )}
                  {/* Campaign group */}
                  {selectedGroup && (
                    <GroupPropertyPanel group={selectedGroup} key={selectedGroup.id} />
                  )}
                  {/* Fallback for other block types */}
                  {selectedBlock && !["cta", "headline", "body", "image", "section"].includes(selectedBlock.type) && (
                    <div className="px-4 py-4">
                      <p className="text-[13px] text-neutral-500">
                        Properties for <span className="font-medium capitalize">{selectedBlock.type}</span> blocks
                      </p>
                      <p className="text-[13px] text-[#7A7A7A] mt-1">{selectedBlock.content}</p>
                    </div>
                  )}
                  {/* Multi-selection */}
                  {selectedIds.length > 1 && (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 mb-3">
                        <span className="text-[14px] font-bold text-neutral-500">{selectedIds.length}</span>
                      </div>
                      <p className="text-[13px] font-medium text-neutral-700">{selectedIds.length} elements selected</p>
                      <p className="text-[13px] text-[#7A7A7A] mt-1">Select a single element to edit properties.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

