"use client";

import { useEffect, useRef, useCallback, useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { useProgressiveGenerationStore } from "@/stores/progressive-generation";
import { AtomicBlock, ChannelType } from "@/types/workspace";
import { ContentGroupCard } from "./ContentGroupCard";
import { AtomicBlockNode } from "./AtomicBlockNode";
import { ConnectionLines } from "./ConnectionLines";
import { CanvasLeftPanel } from "./CanvasLeftPanel";
import { InspectorPanel } from "./InspectorPanel";
import { AgentCommandBar } from "./AgentCommandBar";
import { GenerationConsole } from "@/components/generation/GenerationConsole";
import { cn } from "@/lib/cn";

interface WorkspaceCanvasProps {
  className?: string;
}

export function WorkspaceCanvas({ className }: WorkspaceCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  
  const {
    viewport,
    groups,
    atomicBlocks,
    connections,
    selectedIds,
    drillInChannel,
    isPanning,
    pan,
    zoom,
    setPanning,
    clearSelection,
    exitChannel,
    loadWorkspaceData,
    fitToContent,
  } = useWorkspaceStore();

  const { setActiveTool } = useToolsStore();

  const lastMousePos = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  const drillInData = useMemo(() => {
    if (!drillInChannel) return null;
    const group = groups.find((g) => g.id === drillInChannel.groupId);
    const channel = group?.channels.find((ch) => ch.id === drillInChannel.channelId);
    if (!group || !channel) return null;

    const blockMap = new Map(atomicBlocks.map((b) => [b.id, b]));
    const blocks = channel.atomicBlocks.map((id) => blockMap.get(id)).filter(Boolean) as AtomicBlock[];
    const channelLabel = channel.channel.charAt(0).toUpperCase() + channel.channel.slice(1);

    return { channel, group, blocks, channelLabel };
  }, [drillInChannel, groups, atomicBlocks]);

  const isDrilledIn = !!drillInData;

  const { isGenerating: isProgressiveGenerating } = useProgressiveGenerationStore();

  // Load workspace data on mount, then fit the viewport to show all content
  useEffect(() => {
    // Only load mock data if progressive generation isn't happening
    if (!isProgressiveGenerating) {
      loadWorkspaceData();
    }
    requestAnimationFrame(() => {
      fitToContent();
      setIsReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fit to content when progressive generation adds new groups
  useEffect(() => {
    if (isProgressiveGenerating && groups.length > 0) {
      requestAnimationFrame(() => {
        fitToContent();
      });
    }
  }, [isProgressiveGenerating, groups.length, fitToContent]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.currentTarget === e.target)) {
      isPanningRef.current = true;
      setPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, [setPanning]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      pan(deltaX, deltaY);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [pan]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    setPanning(false);
  }, [setPanning]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      zoom(delta, e.clientX, e.clientY);
    } else {
      pan(-e.deltaX, -e.deltaY);
    }
  }, [zoom, pan]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const { drillInChannel: currentDrill } = useWorkspaceStore.getState();
      if (currentDrill) {
        exitChannel();
      } else {
        clearSelection();
      }
    }
  }, [clearSelection, exitChannel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useWorkspaceStore.getState().resetViewport();
      }
      if (e.key === "=" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        zoom(0.1);
      }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        zoom(-0.1);
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useWorkspaceStore.getState().selectAll();
      }
      if (e.key === "Escape") {
        const { inspectorDetail } = useToolsStore.getState();
        const { drillInChannel: currentDrill } = useWorkspaceStore.getState();
        if (inspectorDetail) {
          useToolsStore.getState().closeInspectorDetail();
        } else if (currentDrill) {
          useWorkspaceStore.getState().exitChannel();
        } else {
          clearSelection();
          setActiveTool("select");
        }
      }

      if (e.key === "v" || e.key === "V") setActiveTool("select");
      if (e.key === "g" || e.key === "G") setActiveTool("group-edit");
      if (e.key === "i" || e.key === "I") setActiveTool("image-edit");
      if (e.key === "l" || e.key === "L") setActiveTool("layout-edit");
      if (e.key === "t" || e.key === "T") setActiveTool("language");
      if (e.key === "k" || e.key === "K") setActiveTool("link");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoom, clearSelection, setActiveTool]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[#F8F9FA] flex", className)}>
      {/* Main canvas area */}
      <div className="flex-1 relative">

        {/* ─── Normal canvas view (hidden when drilled in) ─── */}
        <AnimatePresence>
          {!isDrilledIn && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Grid background */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: "var(--z-canvas-grid)",
                  backgroundImage: `
                    radial-gradient(circle at 1px 1px, rgba(0,0,0,0.07) 1px, transparent 0)
                  `,
                  backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
                  backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                }}
              />

              {/* Canvas container */}
              <div
                ref={canvasRef}
                className={cn(
                  "absolute inset-0",
                  isPanning && "cursor-grabbing",
                  !isPanning && "cursor-default"
                )}
                style={{ zIndex: "var(--z-canvas-content)" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleCanvasClick}
              >
                {/* Transformed content layer */}
                <motion.div
                  className="absolute origin-top-left"
                  style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isReady ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Connection lines */}
                  <div style={{ zIndex: "var(--z-canvas-connections)" }}>
                    <ConnectionLines 
                      connections={connections}
                      groups={groups}
                      atomicBlocks={atomicBlocks}
                    />
                  </div>

                  {/* Content groups */}
                  <AnimatePresence>
                    {groups.map((group, index) => (
                      <ContentGroupCard
                        key={group.id}
                        group={group}
                        index={index}
                        isSelected={selectedIds.includes(group.id)}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Atomic blocks */}
                  <AnimatePresence>
                    {atomicBlocks.map((block, index) => (
                      <AtomicBlockNode
                        key={block.id}
                        block={block}
                        index={index}
                        isSelected={selectedIds.includes(block.id)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Zoom indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 border border-[#DDD]/80 shadow-sm backdrop-blur-sm"
                style={{ zIndex: "var(--z-floating-controls)" }}
              >
                <span className="text-[13px] text-[var(--text-secondary)] tabular-nums">
                  {Math.round(viewport.zoom * 100)}%
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Channel drill-in view (replaces canvas) ─── */}
        <AnimatePresence>
          {drillInData && (
            <ChannelContentView
              groupId={drillInData.group.id}
              channelId={drillInData.channel.id}
              channelType={drillInData.channel.channel}
              channelLabel={drillInData.channelLabel}
              channelStatus={drillInData.channel.status}
              groupName={drillInData.group.name}
              groupColor={drillInData.group.color}
              blocks={drillInData.blocks}
            />
          )}
        </AnimatePresence>

        {/* Left panel — unified nav + tool sidebar */}
        <CanvasLeftPanel isOpen={isLeftPanelOpen} onToggle={() => setIsLeftPanelOpen(p => !p)} />

        {/* AI command bar */}
        <AgentCommandBar />

        {/* Floating inspector panel (right side) */}
        <InspectorPanel />

        {/* Generation Console - shows during progressive generation */}
        <CanvasGenerationConsole />
      </div>
    </div>
  );
}

// ─── Canvas Generation Console Wrapper ─────────────────────────────────────────

function CanvasGenerationConsole() {
  const { steps, isGenerating, showConsole, setShowConsole } = useProgressiveGenerationStore();
  
  return (
    <AnimatePresence>
      {(isGenerating || showConsole) && (
        <GenerationConsole
          steps={steps}
          isVisible={showConsole}
          onMinimize={() => setShowConsole(false)}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Channel Content View ────────────────────────────────────────────────────

const channelMeta: Record<ChannelType, { iconBg: string; icon: React.ReactNode }> = {
  email: {
    iconBg: "bg-blue-500",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  },
  sms: {
    iconBg: "bg-emerald-500",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  whatsapp: {
    iconBg: "bg-green-500",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
  },
  rcs: {
    iconBg: "bg-purple-500",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  },
  web: {
    iconBg: "bg-orange-500",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  },
};

const statusColors: Record<string, string> = {
  draft: "bg-neutral-200 text-neutral-600",
  ready: "bg-emerald-100 text-emerald-700",
  approved: "bg-blue-100 text-blue-700",
};

const fragmentTypes: { type: AtomicBlock["type"]; label: string; icon: React.ReactNode; defaultContent: string }[] = [
  {
    type: "section",
    label: "Section",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>,
    defaultContent: "Section",
  },
  {
    type: "image",
    label: "Image",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    defaultContent: "New Image",
  },
  {
    type: "headline",
    label: "Heading",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h8" /></svg>,
    defaultContent: "New heading",
  },
  {
    type: "body",
    label: "Body text",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
    defaultContent: "Add your body text here...",
  },
  {
    type: "cta",
    label: "Button",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>,
    defaultContent: "Click here",
  },
  {
    type: "disclaimer",
    label: "Disclaimer",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    defaultContent: "Terms and conditions apply.",
  },
  {
    type: "token",
    label: "Personalization",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9Z" /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" /></svg>,
    defaultContent: "{{first_name}}",
  },
];

function ChannelContentView({
  groupId,
  channelId,
  channelType,
  channelLabel,
  channelStatus,
  groupName,
  groupColor,
  blocks,
}: {
  groupId: string;
  channelId: string;
  channelType: ChannelType;
  channelLabel: string;
  channelStatus: string;
  groupName: string;
  groupColor: string;
  blocks: AtomicBlock[];
}) {
  const {
    select,
    selectedIds,
    drillInChannel,
    exitChannel,
    addAtomicBlockToChannel,
    reorderChannelBlocks,
    insertAtomicBlockAtIndex,
  } = useWorkspaceStore();
  const { openInspectorBlockDetail, closeInspectorDetail, inspectorDetail } = useToolsStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState<number | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const meta = channelMeta[channelType];

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  
  // Close inspector when clicking outside elements
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // If clicking directly on the content area (not on a block)
    if (target.closest('[data-block-wrapper]') === null && inspectorDetail) {
      closeInspectorDetail();
      select([]);
    }
  };

  // Handle inserting element at specific index
  const handleInsertFragment = (type: AtomicBlock["type"], defaultContent: string, atIndex: number) => {
    if (!drillInChannel) return;
    const newId = insertAtomicBlockAtIndex(
      drillInChannel.groupId,
      drillInChannel.channelId,
      type,
      defaultContent,
      atIndex,
    );
    setInsertMenuIndex(null);
    openInspectorBlockDetail(newId);
  };
  
  // Close insert menu on click outside
  useEffect(() => {
    if (insertMenuIndex === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
        setInsertMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [insertMenuIndex]);

  const handleBlockClick = (blockId: string) => {
    if (dragIndex !== null) return;
    select([blockId]);
    openInspectorBlockDetail(blockId);
  };

  const handleAddFragment = (type: AtomicBlock["type"], defaultContent: string) => {
    if (!drillInChannel) return;
    const newId = addAtomicBlockToChannel(
      drillInChannel.groupId,
      drillInChannel.channelId,
      type,
      defaultContent,
    );
    setShowAddMenu(false);
    openInspectorBlockDetail(newId);
  };

  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      e.currentTarget.style.opacity = "0.4";
    }
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    if (dragIndex !== null && dropTarget !== null && dragIndex !== dropTarget) {
      reorderChannelBlocks(groupId, channelId, dragIndex, dropTarget);
    }
    setDragIndex(null);
    setDropTarget(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dropTarget) {
      setDropTarget(index);
    }
  };

  const isCompact = channelType === "sms" || channelType === "rcs";

  // Type label mapping
  const typeLabels: Record<AtomicBlock["type"], string> = {
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

  const renderBlock = (block: AtomicBlock) => {
    const isSelected = selectedIds.includes(block.id);
    const isHovered = hoveredBlockId === block.id;
    const showLabel = isSelected || isHovered;
    
    // Section wrapper border styles (for the full-width container)
    const getSectionClass = (alignment: "left" | "center" | "right" = "left") => cn(
      "w-full rounded-lg px-3 py-2 border-2 transition-all cursor-pointer relative",
      isSelected
        ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
        : isHovered
          ? "border-blue-400 bg-neutral-50/50"
          : "border-transparent",
      alignment === "left" && "text-left",
      alignment === "center" && "text-center",
      alignment === "right" && "text-right",
    );

    // Floating type label
    const TypeLabel = ({ label }: { label?: string }) => showLabel ? (
      <div className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-blue-500 text-white text-[11px] font-semibold rounded shadow-sm z-10">
        {label || typeLabels[block.type] || block.type}
      </div>
    ) : null;
    
    switch (block.type) {
      case "image":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={getSectionClass("center")}
          >
            <TypeLabel />
            <div className="w-full aspect-[16/9] rounded-xl bg-[var(--surface-active)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-[13px] font-medium">{block.content}</span>
              </div>
            </div>
          </div>
        );
      case "headline":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={getSectionClass("left")}
          >
            <TypeLabel />
            <p className={cn(
              "font-bold text-[var(--text-primary)]",
              isCompact ? "text-heading-small" : "text-heading-medium",
            )}>
              {block.content}
            </p>
          </div>
        );
      case "body":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={getSectionClass("left")}
          >
            <TypeLabel />
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{block.content}</p>
          </div>
        );
      case "section":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={cn(
              getSectionClass(block.alignment || "left"),
              "min-h-[60px]",
            )}
            style={{ backgroundColor: block.backgroundColor || "transparent" }}
          >
            <TypeLabel />
            {/* Section can contain child elements - for now show placeholder */}
            {(!block.children || block.children.length === 0) && (
              <div className="flex items-center justify-center py-4 text-[var(--text-muted)] text-[13px] border border-dashed border-[var(--border)] rounded-lg">
                <span>Empty section - add elements</span>
              </div>
            )}
          </div>
        );
      case "cta":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={cn(
              "inline-block rounded-xl px-6 py-3 font-semibold text-[14px] bg-neutral-900 text-white border-2 transition-all cursor-pointer relative",
              isSelected
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : isHovered
                  ? "border-blue-400"
                  : "border-transparent",
            )}
          >
            <TypeLabel />
            {block.content}
          </div>
        );
      case "disclaimer":
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={getSectionClass("left")}
          >
            <TypeLabel />
            <p className="text-[13px] text-[var(--text-muted)] italic">{block.content}</p>
          </div>
        );
      default:
        return (
          <div
            onClick={() => handleBlockClick(block.id)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId(null)}
            className={getSectionClass("left")}
          >
            <TypeLabel />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">{block.type}</span>
            <p className="text-[13px] text-[var(--text-secondary)]">{block.content}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex flex-col items-center overflow-y-auto pb-24"
      style={{ zIndex: "var(--z-canvas-content)" }}
      onClick={handleCanvasClick}
    >
      {/* Back control + channel context (focus mode) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-4 px-4 flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            exitChannel();
          }}
          className="inline-flex items-center gap-1.5 h-12 shrink-0 px-4 rounded-xl bg-[var(--surface)] shadow-[0_2px_10px_rgba(0,0,0,0.14)] border border-[#DDD]/60 text-[13px] font-semibold text-neutral-800 hover:bg-[var(--surface-hover)] hover:border-[var(--border)] transition-colors"
        >
          <svg
            className="w-4 h-4 text-[var(--text-secondary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to canvas
        </button>
        <div className="flex items-center gap-2 h-12 px-4 bg-[var(--surface)] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.14)] border border-[#DDD]/60 flex-shrink-0">
          <span className="text-[13px] text-[var(--text-secondary)]">{groupName}</span>
          <svg className="w-3 h-3 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
          <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white", meta.iconBg)}>
            {meta.icon}
          </div>
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{channelLabel}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ml-1", statusColors[channelStatus])}>
            {channelStatus}
          </span>
        </div>
      </div>

      {/* Channel content card */}
      <div className={cn("mt-6 mb-32 w-full px-4", isCompact ? "max-w-[400px]" : "max-w-[560px]")}>
        <div className="bg-[var(--surface)] rounded-2xl shadow-lg border border-[#DDD]/80">
          <div
            className="h-1.5 w-full rounded-t-2xl"
            style={{ backgroundColor: groupColor }}
          />

          <div className="p-6 space-y-1">
            {blocks.map((block, index) => (
              <Fragment key={block.id}>
                {/* Inline add button between elements */}
                {index > 0 && (
                  <div className="relative h-4 group/insert -my-1" style={{ zIndex: insertMenuIndex === index ? 100 : 1 }}>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover/insert:opacity-100 transition-opacity">
                      <div className="flex-1 h-px bg-blue-300" />
                      <div className="relative" ref={insertMenuIndex === index ? insertMenuRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInsertMenuIndex(insertMenuIndex === index ? null : index);
                          }}
                          className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        
                        {/* Inline insert menu */}
                        <AnimatePresence>
                          {insertMenuIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.97 }}
                              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-[var(--surface)] rounded-lg shadow-lg border border-[#DDD]/80"
                              style={{ zIndex: 200 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                {fragmentTypes.slice(0, 4).map((ft) => (
                                  <button
                                    key={ft.type}
                                    onClick={() => handleInsertFragment(ft.type, ft.defaultContent, index)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
                                  >
                                    <div className="w-6 h-6 rounded bg-[var(--surface-active)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
                                      {ft.icon}
                                    </div>
                                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">{ft.label}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex-1 h-px bg-blue-300" />
                    </div>
                  </div>
                )}
                
                <div
                  data-block-wrapper
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver(index)}
                  className="relative group"
                >
                  {/* Drop indicator above */}
                  {dragIndex !== null && dropTarget === index && dragIndex !== index && (
                    <div className="absolute -top-0.5 left-0 right-0 h-[3px] bg-blue-500 rounded-full z-10" />
                  )}

                  {renderBlock(block)}
                </div>
              </Fragment>
            ))}

            {/* Add element at bottom - same style as inline */}
            <div className="relative pt-3" ref={addMenuRef} style={{ zIndex: showAddMenu ? 100 : 1 }}>
              <div className="flex items-center justify-center">
                <div className="flex-1 h-px bg-neutral-200" />
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMenu((v) => !v);
                    }}
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm",
                      showAddMenu
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white hover:bg-blue-600",
                    )}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showAddMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-[var(--surface)] rounded-lg shadow-lg border border-[#DDD]/80"
                        style={{ zIndex: 200 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          {fragmentTypes.slice(0, 4).map((ft) => (
                            <button
                              key={ft.type}
                              onClick={() => handleAddFragment(ft.type, ft.defaultContent)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
                            >
                              <div className="w-6 h-6 rounded bg-[var(--surface-active)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
                                {ft.icon}
                              </div>
                              <span className="text-[13px] font-medium text-[var(--text-secondary)]">{ft.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
