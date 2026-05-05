"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useProgressiveGenerationStore } from "@/stores/progressive-generation";
import { ChannelCard, CardVariant, ContentElement, ChannelType } from "@/types/simple-canvas";
import { GenerationConsole } from "@/components/generation/GenerationConsole";
import { ImageEditPanel } from "./ImageEditPanel";
import { AssetPicker } from "./AssetPicker";
import { MiniMap } from "./MiniMap";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContentTypeIcon } from "@/components/ui/ContentTypeIcon";
import { cn } from "@/lib/cn";
import { useThemeStore } from "@/stores/theme";
import { useCanvasStore } from "@/stores/canvas";
import { useRegulatedContentStore, filterClaimsForContext, elementKey } from "@/stores/regulated-content";
import { regulatedEmailChromeAnchors } from "@/lib/regulated-email-anchors";
import { scanCardsForCompliance } from "@/lib/compliance-scan";
import { ComplianceFlagIcon } from "@/components/regulated/ComplianceFlagIcon";
import { ElementSidePanel, RephraseIcon, SourcesIcon } from "@/components/regulated/ElementSidePanel";
import { RephraseElementPopup } from "@/components/regulated/RephraseElementPopup";

interface SimpleCanvasProps {
  className?: string;
}

export function SimpleCanvas({ className }: SimpleCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const projectId = useCanvasStore((s) => s.projectId);
  const stripWorkspaceChrome = projectId === "proj-pharma-email";

  const {
    viewport,
    cards,
    selectedCardId,
    selectedCardIds,
    isPanning,
    pan,
    zoom,
    selectCard,
    toggleCardSelection,
    selectMultipleCards,
    clearSelection,
    setPanning,
    loadInitialData,
    fitToContent,
    hiddenCardIds,
    cardGroups,
  } = useSimpleCanvasStore();

  const progressiveGeneration = useProgressiveGenerationStore();

  const groupFrames = useMemo(() => {
    return cardGroups
      .filter((g) => g.cardIds.some((cid) => cards.some((c) => c.id === cid && !hiddenCardIds.has(c.id))))
      .map((group) => ({
        id: group.id,
        name: group.name,
        x: group.position.x,
        y: group.position.y,
        width: group.size.width,
        height: group.size.height,
      }));
  }, [cardGroups, cards, hiddenCardIds]);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const didPanMove = useRef(false);

  // Marquee selection state
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const marqueeRef = useRef<typeof marquee>(null);
  const isMarqueeRef = useRef(false);

  // Spacebar-held panning mode (like Figma)
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false);

  // Z-key zoom-drag tool
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const zoomToolRef = useRef(false);
  const [zoomRect, setZoomRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const zoomRectRef = useRef<typeof zoomRect>(null);
  const isZoomDragging = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,[contenteditable]")) return;

      if (e.code === "Space") {
        e.preventDefault();
        spaceHeldRef.current = true;
        setSpaceHeld(true);
      }
      // Z without modifiers → zoom tool
      if (e.key === "z" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        zoomToolRef.current = true;
        setZoomToolActive(true);
      }
      // Cmd/Ctrl+Z → Undo
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        useSimpleCanvasStore.getState().undo();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        setSpaceHeld(false);
      }
      if (e.key === "z") {
        zoomToolRef.current = false;
        setZoomToolActive(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Load initial data only if the store is empty (avoids resetting on preview↔canvas switch).
  // Must read getState() here — parent useLayoutEffect may set isGenerating before this runs,
  // but hook values from the first render would still be stale with [] deps.
  useEffect(() => {
    const progressive = useProgressiveGenerationStore.getState();
    const simple = useSimpleCanvasStore.getState();
    if (!progressive.isGenerating && !simple.isGenerating && simple.cards.length === 0) {
      loadInitialData();
    }
    requestAnimationFrame(() => {
      fitToContent();
      setIsReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit to content when cards change during generation
  useEffect(() => {
    if (cards.length > 0) {
      requestAnimationFrame(() => {
        fitToContent();
      });
    }
  }, [cards.length, fitToContent]);

  // Helper: get cards inside a screen-space rectangle
  const getCardsInRect = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);
    const { x: vx, y: vy, zoom: vz } = useSimpleCanvasStore.getState().viewport;
    return cards.filter((card) => {
      const cl = card.position.x * vz + vx;
      const ct = card.position.y * vz + vy;
      const cr = cl + card.size.width * vz;
      const cb = ct + card.size.height * vz;
      return cr > left && cl < right && cb > top && ct < bottom;
    }).map((c) => c.id);
  }, [cards]);

  // Panning + marquee + zoom-rect handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle-click always pans
    if (e.button === 1) {
      isPanningRef.current = true;
      setPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    // Left-click on canvas background
    if (e.button === 0 && e.currentTarget === e.target) {
      if (zoomToolRef.current) {
        // Z held → zoom-drag rectangle
        const m = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY };
        zoomRectRef.current = m;
        isZoomDragging.current = false;
        e.preventDefault();
        return;
      }
      if (spaceHeldRef.current) {
        // Spacebar held → pan
        isPanningRef.current = true;
        didPanMove.current = false;
        setPanning(true);
      } else {
        // Default → marquee selection
        const m = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY };
        marqueeRef.current = m;
        isMarqueeRef.current = false;
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, [setPanning]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Zoom-drag rectangle
    if (zoomRectRef.current) {
      const dx = e.clientX - zoomRectRef.current.startX;
      const dy = e.clientY - zoomRectRef.current.startY;
      if (!isZoomDragging.current && Math.hypot(dx, dy) > 5) {
        isZoomDragging.current = true;
      }
      if (isZoomDragging.current) {
        const updated = { ...zoomRectRef.current, currentX: e.clientX, currentY: e.clientY };
        zoomRectRef.current = updated;
        setZoomRect(updated);
      }
      return;
    }
    // Panning
    if (isPanningRef.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) didPanMove.current = true;
      pan(deltaX, deltaY);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    // Marquee drag
    if (marqueeRef.current) {
      const dx = e.clientX - marqueeRef.current.startX;
      const dy = e.clientY - marqueeRef.current.startY;
      if (!isMarqueeRef.current && Math.hypot(dx, dy) > 5) {
        isMarqueeRef.current = true;
      }
      if (isMarqueeRef.current) {
        const updated = { ...marqueeRef.current, currentX: e.clientX, currentY: e.clientY };
        marqueeRef.current = updated;
        setMarquee(updated);
      }
    }
  }, [pan]);

  const handleMouseUp = useCallback((e: React.MouseEvent | React.SyntheticEvent) => {
    // End zoom-drag rectangle → zoom to fit selected area
    if (zoomRectRef.current) {
      if (isZoomDragging.current) {
        const { startX, startY, currentX, currentY } = zoomRectRef.current;
        const rectLeft = Math.min(startX, currentX);
        const rectTop = Math.min(startY, currentY);
        const rectW = Math.abs(currentX - startX);
        const rectH = Math.abs(currentY - startY);

        if (rectW > 10 && rectH > 10 && canvasRef.current) {
          const canvasBounds = canvasRef.current.getBoundingClientRect();
          const { x: vx, y: vy, zoom: vz } = useSimpleCanvasStore.getState().viewport;

          const worldLeft = (rectLeft - canvasBounds.left - vx) / vz;
          const worldTop = (rectTop - canvasBounds.top - vy) / vz;
          const worldW = rectW / vz;
          const worldH = rectH / vz;

          const screenW = canvasBounds.width;
          const screenH = canvasBounds.height;
          const padding = 40;
          let newZoom = Math.min(
            (screenW - padding * 2) / worldW,
            (screenH - padding * 2) / worldH,
          );
          newZoom = Math.max(0.25, Math.min(2, newZoom));

          const newX = (screenW / 2) - (worldLeft + worldW / 2) * newZoom;
          const newY = (screenH / 2) - (worldTop + worldH / 2) * newZoom;

          useSimpleCanvasStore.setState({ viewport: { x: newX, y: newY, zoom: newZoom } });
        }
      }
      zoomRectRef.current = null;
      isZoomDragging.current = false;
      setZoomRect(null);
      return;
    }
    // End marquee
    if (marqueeRef.current) {
      if (isMarqueeRef.current) {
        const { startX, startY, currentX, currentY } = marqueeRef.current;
        const ids = getCardsInRect(startX, startY, currentX, currentY);
        const nativeEvent = (e as React.MouseEvent).nativeEvent;
        if (nativeEvent && (nativeEvent.shiftKey || nativeEvent.altKey)) {
          const existing = useSimpleCanvasStore.getState().selectedCardIds;
          const merged = Array.from(new Set([...existing, ...ids]));
          selectMultipleCards(merged);
        } else {
          selectMultipleCards(ids);
        }
      } else if (!isMarqueeRef.current) {
        clearSelection();
      }
      marqueeRef.current = null;
      isMarqueeRef.current = false;
      setMarquee(null);
    }
    // End panning — if no drag occurred, treat as a click to deselect
    if (isPanningRef.current && !didPanMove.current) {
      clearSelection();
    }
    isPanningRef.current = false;
    didPanMove.current = false;
    setPanning(false);
  }, [getCardsInRect, selectMultipleCards, clearSelection, setPanning]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      zoom(delta, e.clientX, e.clientY);
    } else {
      pan(-e.deltaX, -e.deltaY);
    }
  }, [zoom, pan]);

  const handleCanvasClick = useCallback((_e: React.MouseEvent) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useSimpleCanvasStore.getState().resetViewport();
      }
      if (e.key === "=" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        zoom(0.1);
      }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        zoom(-0.1);
      }
      if (e.key === "Escape") {
        clearSelection();
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        selectMultipleCards(cards.map((c) => c.id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoom, clearSelection, selectMultipleCards, cards]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[var(--background)] select-none", className)}>
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Canvas container */}
      <div
        ref={canvasRef}
        className={cn(
          "absolute inset-0",
          zoomToolActive ? "cursor-zoom-in" : isPanning ? "cursor-grabbing" : spaceHeld ? "cursor-grab" : "cursor-default"
        )}
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
          {/* Group frames */}
          {groupFrames.map((frame) => (
            <GroupFrame key={`group-frame-${frame.id}`} frame={frame} />
          ))}

          <AnimatePresence>
            {cards.filter((c) => !hiddenCardIds.has(c.id)).map((card, index) => (
              <ChannelCardComponent
                key={card.id}
                card={card}
                index={index}
                isSelected={selectedCardIds.includes(card.id)}
                onSelect={(e: React.MouseEvent) => {
                  if (e.shiftKey || e.altKey) {
                    toggleCardSelection(card.id);
                  } else {
                    selectCard(card.id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Marquee selection rectangle */}
      {marquee && isMarqueeRef.current && (
        <div
          className="absolute pointer-events-none border border-neutral-400 bg-neutral-900/5 rounded-sm"
          style={{
            left: Math.min(marquee.startX, marquee.currentX),
            top: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
          }}
        />
      )}

      {/* Zoom-drag rectangle */}
      {zoomRect && isZoomDragging.current && (
        <div
          className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/10 rounded-sm"
          style={{
            left: Math.min(zoomRect.startX, zoomRect.currentX),
            top: Math.min(zoomRect.startY, zoomRect.currentY),
            width: Math.abs(zoomRect.currentX - zoomRect.startX),
            height: Math.abs(zoomRect.currentY - zoomRect.startY),
          }}
        />
      )}

      {/* Canvas navigation minimap */}
      {!stripWorkspaceChrome && <MiniMap />}


      {/* Generation Console */}
      <AnimatePresence>
        {(progressiveGeneration.isGenerating || progressiveGeneration.showConsole) && (
          <GenerationConsole
            steps={progressiveGeneration.steps}
            isVisible={progressiveGeneration.showConsole}
            onMinimize={() => progressiveGeneration.setShowConsole(false)}
          />
        )}
      </AnimatePresence>

      {/* Image Edit Panel - appears when image is selected */}
      <ImageEditPanel />

      {/* Asset Picker Modal */}
      <AssetPicker />
    </div>
  );
}

// Group Frame Component — draggable container that moves all grouped cards together
interface GroupFrameProps {
  frame: { id: string; name: string; x: number; y: number; width: number; height: number };
}

function GroupFrame({ frame }: GroupFrameProps) {
  const { moveGroup, resizeGroup, moveCards, renameGroup, selectGroup, selectedGroupId, cardGroups, cards } = useSimpleCanvasStore();
  const dragStart = useRef<{ mx: number; my: number; fx: number; fy: number; fw: number; fh: number; cardOrigins: { id: string; x: number; y: number }[] } | null>(null);
  const didDrag = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(frame.name);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedGroupId === frame.id;

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== frame.name) renameGroup(frame.id, trimmed);
    setIsEditing(false);
  }, [editValue, frame.id, frame.name, renameGroup]);

  const pendingDragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    if (isEditing) return;
    if (e.detail >= 2) return;

    didDrag.current = false;
    const group = cardGroups.find((g) => g.id === frame.id);
    if (!group) return;

    const cardOrigins = group.cardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({ id: c!.id, x: c!.position.x, y: c!.position.y }));

    const startData = { mx: e.clientX, my: e.clientY, fx: frame.x, fy: frame.y, fw: frame.width, fh: frame.height, cardOrigins };
    let dragActive = false;

    const onMove = (ev: MouseEvent) => {
      const dist = Math.hypot(ev.clientX - startData.mx, ev.clientY - startData.my);
      if (dist > 5) {
        dragActive = true;
        didDrag.current = true;
        setIsDragging(true);
        const { zoom } = useSimpleCanvasStore.getState().viewport;
        const dx = (ev.clientX - startData.mx) / zoom;
        const dy = (ev.clientY - startData.my) / zoom;
        moveGroup(frame.id, { x: startData.fx + dx, y: startData.fy + dy });
        const updates = startData.cardOrigins.map((o) => ({
          id: o.id,
          position: { x: o.x + dx, y: o.y + dy },
        }));
        moveCards(updates);
      }
    };

    const onUp = () => {
      setIsDragging(false);
      if (!didDrag.current) selectGroup(frame.id);
      dragStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    // Delay attaching drag listeners to allow double-click detection
    pendingDragTimer.current = setTimeout(() => {
      pendingDragTimer.current = null;
      dragStart.current = startData;
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }, 200);

    // Immediate mouseup cleanup (for quick clicks / double-clicks)
    const onImmediateUp = () => {
      if (pendingDragTimer.current) {
        clearTimeout(pendingDragTimer.current);
        pendingDragTimer.current = null;
      }
      if (!dragActive) selectGroup(frame.id);
      window.removeEventListener("mouseup", onImmediateUp);
    };
    window.addEventListener("mouseup", onImmediateUp);
  }, [frame, cardGroups, cards, moveCards, moveGroup, isEditing, selectGroup]);

  const handleEdgeMouseDown = useCallback((e: React.MouseEvent, edge: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = frame.x;
    const origY = frame.y;
    const origW = frame.width;
    const origH = frame.height;
    const MIN_W = 200;
    const MIN_H = 100;

    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const { zoom } = useSimpleCanvasStore.getState().viewport;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let nx = origX, ny = origY, nw = origW, nh = origH;

      if (edge.includes("e")) nw = Math.max(MIN_W, origW + dx);
      if (edge.includes("s")) nh = Math.max(MIN_H, origH + dy);
      if (edge.includes("w")) { nw = Math.max(MIN_W, origW - dx); nx = origX + origW - nw; }
      if (edge.includes("n")) { nh = Math.max(MIN_H, origH - dy); ny = origY + origH - nh; }

      resizeGroup(frame.id, { x: nx, y: ny }, { width: nw, height: nh });
    };

    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [frame, resizeGroup]);

  const edgeSize = 6;
  const edges = [
    { key: "n",  style: { top: -edgeSize / 2, left: edgeSize, right: edgeSize, height: edgeSize, cursor: "ns-resize" } },
    { key: "s",  style: { bottom: -edgeSize / 2, left: edgeSize, right: edgeSize, height: edgeSize, cursor: "ns-resize" } },
    { key: "w",  style: { left: -edgeSize / 2, top: edgeSize, bottom: edgeSize, width: edgeSize, cursor: "ew-resize" } },
    { key: "e",  style: { right: -edgeSize / 2, top: edgeSize, bottom: edgeSize, width: edgeSize, cursor: "ew-resize" } },
    { key: "nw", style: { top: -edgeSize / 2, left: -edgeSize / 2, width: edgeSize * 2, height: edgeSize * 2, cursor: "nwse-resize" } },
    { key: "ne", style: { top: -edgeSize / 2, right: -edgeSize / 2, width: edgeSize * 2, height: edgeSize * 2, cursor: "nesw-resize" } },
    { key: "sw", style: { bottom: -edgeSize / 2, left: -edgeSize / 2, width: edgeSize * 2, height: edgeSize * 2, cursor: "nesw-resize" } },
    { key: "se", style: { bottom: -edgeSize / 2, right: -edgeSize / 2, width: edgeSize * 2, height: edgeSize * 2, cursor: "nwse-resize" } },
  ];

  return (
    <div
      className={cn(
        "absolute rounded-xl bg-[var(--surface)] select-none",
        isSelected ? "border-2 border-[#0F8EFF] shadow-[0_0_0_2px_rgba(15,142,255,0.15)]" : "border border-[var(--border)]",
        !isResizing && (isDragging ? "cursor-grabbing" : "cursor-grab"),
      )}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setEditValue(frame.name);
        setIsEditing(true);
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsEditing(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-1.5 left-2.5 px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[13px] font-semibold text-[var(--text-secondary)] outline-none focus:border-neutral-400"
          style={{ width: Math.max(80, frame.width - 24) }}
        />
      ) : (
        <span
          className="absolute top-2 left-3 px-2 py-0.5 rounded-md bg-[var(--surface-active)] text-[13px] font-semibold text-[var(--text-secondary)] pointer-events-auto select-none cursor-text"
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditValue(frame.name);
            setIsEditing(true);
          }}
        >
          {frame.name}
        </span>
      )}

      {/* Resize edge handles */}
      {edges.map(({ key, style }) => (
        <div
          key={key}
          className="absolute z-10"
          style={{ ...style, position: "absolute" } as React.CSSProperties}
          onMouseDown={(e) => handleEdgeMouseDown(e, key)}
        />
      ))}
    </div>
  );
}

// Channel Card Component
interface ChannelCardComponentProps {
  card: ChannelCard;
  index: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

const channelBgColorLight: Record<ChannelType, string> = {
  email: "#F0F6FF",
  sms: "#ECFDF5",
};
const channelBgColorDark: Record<ChannelType, string> = {
  email: "rgba(79,130,200,0.12)",
  sms: "rgba(60,180,120,0.12)",
};

const SMS_ALLOWED_TYPES = new Set(["body"]);
const SMS_MAX_CHARS = 160;

function ChannelCardComponent({ card, index, isSelected, onSelect }: ChannelCardComponentProps) {
  const projectId = useCanvasStore((s) => s.projectId);
  const regulatedEmailAnchors = useMemo(
    () =>
      projectId === "proj-pharma-email" && card.channel === "email"
        ? regulatedEmailChromeAnchors(card.elements)
        : { claimHintIds: new Set<string>(), flagIds: new Set<string>() },
    [projectId, card.channel, card.elements],
  );

  const { moveCard, moveCards, addElement, insertElement, updateElement, addVariant, removeVariant, updateVariantElement, selectVariant, selectedVariantId, cardGroups, removeFromGroup, selectedElement, selectElement, selectImageVariation, setImageVariationsRefreshing, setImageVariations, addGeneratedImages } = useSimpleCanvasStore();

  // Side panel — active text element for this card
  const [rephraseOpen, setRephraseOpen] = useState(false);
  const [rephraseTargetElement, setRephraseTargetElement] = useState<ContentElement | null>(null);

  const activeElement = useMemo(() => {
    if (!selectedElement || selectedElement.cardId !== card.id) return null;
    return card.elements.find((e) => e.id === selectedElement.elementId) ?? null;
  }, [selectedElement, card.id, card.elements]);

  const activeIsTextElement =
    activeElement?.type === "headline" ||
    activeElement?.type === "body" ||
    activeElement?.type === "cta";

  const regulatedProfile = useRegulatedContentStore((s) => s.profile);
  const regulatedDismissed = useRegulatedContentStore((s) => s.dismissedByElement);
  const activeSuggestionCount = useMemo(() => {
    if (!activeElement || !activeIsTextElement || activeElement.type === "divider") return 0;
    const dismissed = regulatedDismissed[elementKey(card.id, activeElement.id)] ?? [];
    return filterClaimsForContext({
      profile: regulatedProfile,
      channel: card.channel as "email" | "sms",
      elementType: activeElement.type as "headline" | "body" | "cta",
      dismissedIds: dismissed,
    }).length;
  }, [activeElement, activeIsTextElement, regulatedProfile, regulatedDismissed, card.id, card.channel]);

  // Measure the selected element's vertical offset within the card so the side panel aligns with it
  const canvasZoom = useSimpleCanvasStore((s) => s.viewport.zoom);

  // getBoundingClientRect() returns screen pixels (after the canvas zoom transform).
  // CSS `top` on an absolutely-positioned child is in local (pre-zoom) canvas pixels,
  // so we must divide by zoom to convert back.
  const [sidePanelTop, setSidePanelTop] = useState(0);
  useLayoutEffect(() => {
    if (!activeElement || !dragRef.current) {
      setSidePanelTop(0);
      return;
    }
    const el = dragRef.current.querySelector<HTMLElement>(`[data-element-id="${activeElement.id}"]`);
    if (!el) { setSidePanelTop(0); return; }
    const cardRect = dragRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setSidePanelTop((elRect.top - cardRect.top) / canvasZoom);
  }, [activeElement?.id, card.elements, canvasZoom]);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === "dark";
  const isEmail = card.channel === "email";
  const channelBgColor = (isDark && !isEmail) ? channelBgColorDark : channelBgColorLight;
  const isCardGenerating = card.status === "generating";
  const stripWorkspaceChrome = projectId === "proj-pharma-email";
  const isLockedInReview = stripWorkspaceChrome && card.status === "review";
  const isLazySkeleton =
    isCardGenerating &&
    card.elements.length > 0 &&
    card.elements.every((e) => e.isLoading);
  const [variantsExpanded, setVariantsExpanded] = useState(false);

  useEffect(() => {
    if (isSelected && selectedVariantId && card.variants?.some((v) => v.id === selectedVariantId)) {
      setVariantsExpanded(true);
    }
  }, [isSelected, selectedVariantId, card.variants]);
  const variantCount = (card.variants?.length ?? 0) + 1; // +1 for the original

  const activeVariationEl = useMemo(() => {
    return card.elements.find((e) => e.type === "image" && e.imageVariations);
  }, [card.elements]);

  const isVariationElSelected = activeVariationEl
    ? selectedElement?.cardId === card.id && selectedElement?.elementId === activeVariationEl.id
    : false;

  const handleVariationRefresh = useCallback((elId: string, currentVariations: NonNullable<import("@/types/simple-canvas").ContentElement["imageVariations"]>) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const batches = [
      [
        { src: `${basePath}/images/ws/cutlery-1.jpg`, alt: "Williams Sonoma Cutlery Set — Option 1" },
        { src: `${basePath}/images/ws/cutlery-2.jpg`, alt: "Williams Sonoma Cutlery Set — Option 2" },
        { src: `${basePath}/images/ws/cutlery-3.jpg`, alt: "Williams Sonoma Cutlery Set — Option 3" },
        { src: `${basePath}/images/ws/cutlery-4.jpg`, alt: "Williams Sonoma Cutlery Set — Option 4" },
      ],
      [
        { src: `${basePath}/images/ws/cutlery-5.jpg`, alt: "Williams Sonoma Cutlery Set — Option 5" },
        { src: `${basePath}/images/ws/cutlery-6.jpg`, alt: "Williams Sonoma Cutlery Set — Option 6" },
        { src: `${basePath}/images/ws/cutlery-7.jpg`, alt: "Williams Sonoma Cutlery Set — Option 7" },
        { src: `${basePath}/images/ws/cutlery-8.jpg`, alt: "Williams Sonoma Cutlery Set — Option 8" },
      ],
    ];
    const currentSrc = currentVariations.options[0]?.src ?? "";
    const currentIdx = batches.findIndex((b) => b[0].src === currentSrc);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % batches.length;
    const nextBatch = batches[nextIdx];

    setImageVariationsRefreshing(card.id, elId, true);

    setTimeout(() => {
      setImageVariations(card.id, elId, nextBatch);
      useSimpleCanvasStore.getState().replaceImage(card.id, elId, nextBatch[0].src, nextBatch[0].alt);
      addGeneratedImages(nextBatch);
    }, 2800);
  }, [card.id, setImageVariationsRefreshing, setImageVariations, addGeneratedImages]);

  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [dropRejected, setDropRejected] = useState(false);
  const [dropIndex, setDropIndex] = useState<number>(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  const [variationToolbarTop, setVariationToolbarTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!activeVariationEl?.imageVariations || !isVariationElSelected) {
      setVariationToolbarTop(null);
      return;
    }
    const outer = dragRef.current;
    if (!outer) return;
    const anchor = outer.querySelector("[data-image-variation-anchor]") as HTMLElement | null;
    if (!anchor) { setVariationToolbarTop(null); return; }
    let top = 0;
    let el: HTMLElement | null = anchor;
    while (el && el !== outer) {
      top += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    setVariationToolbarTop(top + anchor.offsetHeight);
  }, [activeVariationEl, isVariationElSelected, card.elements]);
  const dragStart = useRef({ x: 0, y: 0, cardX: 0, cardY: 0 });
  const peerOrigins = useRef<{ id: string; x: number; y: number }[]>([]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-editable]') || target.closest('button') || target.closest('input') || target.closest('textarea')) return;

    e.stopPropagation();

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      cardX: card.position.x,
      cardY: card.position.y,
    };

    // Snapshot positions of other selected cards for multi-drag
    const { selectedCardIds, cards: allCards } = useSimpleCanvasStore.getState();
    const isPartOfSelection = selectedCardIds.includes(card.id) && selectedCardIds.length > 1;
    if (isPartOfSelection) {
      peerOrigins.current = allCards
        .filter((c) => selectedCardIds.includes(c.id) && c.id !== card.id)
        .map((c) => ({ id: c.id, x: c.position.x, y: c.position.y }));
    } else {
      peerOrigins.current = [];
    }

    const handleMouseMove = (ev: MouseEvent) => {
      const dist = Math.hypot(ev.clientX - dragStart.current.x, ev.clientY - dragStart.current.y);
      if (dist > 5) {
        setIsDragging(true);
        const { zoom } = useSimpleCanvasStore.getState().viewport;
        const deltaX = (ev.clientX - dragStart.current.x) / zoom;
        const deltaY = (ev.clientY - dragStart.current.y) / zoom;

        if (peerOrigins.current.length > 0) {
          // Move all selected cards together
          const updates = [
            { id: card.id, position: { x: dragStart.current.cardX + deltaX, y: dragStart.current.cardY + deltaY } },
            ...peerOrigins.current.map((p) => ({
              id: p.id,
              position: { x: p.x + deltaX, y: p.y + deltaY },
            })),
          ];
          moveCards(updates);
        } else {
          moveCard(card.id, {
            x: dragStart.current.cardX + deltaX,
            y: dragStart.current.cardY + deltaY,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      peerOrigins.current = [];
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Check if card was dragged outside/inside a group frame
      const store = useSimpleCanvasStore.getState();
      const latestCard = store.cards.find((c) => c.id === card.id);
      if (!latestCard) return;

      const cx = latestCard.position.x;
      const cy = latestCard.position.y;
      const cRight = cx + latestCard.size.width;
      const cBottom = cy + latestCard.size.height;
      const cCenterX = (cx + cRight) / 2;
      const cCenterY = (cy + cBottom) / 2;

      const currentGroup = store.cardGroups.find((g) => g.cardIds.includes(card.id));

      if (currentGroup) {
        // Card is in a group — check if dragged outside
        const g = currentGroup;
        const isOutside = cRight < g.position.x || cx > g.position.x + g.size.width || cBottom < g.position.y || cy > g.position.y + g.size.height;
        if (isOutside) {
          store.removeFromGroup(g.id, [card.id]);
        }
      } else {
        // Card is ungrouped — check if dragged inside a group frame (by center point)
        const targetGroup = store.cardGroups.find((g) =>
          cCenterX >= g.position.x && cCenterX <= g.position.x + g.size.width &&
          cCenterY >= g.position.y && cCenterY <= g.position.y + g.size.height
        );
        if (targetGroup) {
          store.addToGroup(targetGroup.id, [card.id]);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [card.id, card.position.x, card.position.y, moveCard, moveCards]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onSelect(e);
    }
  };

  const handleElementChange = useCallback((elementId: string, newContent: string) => {
    updateElement(card.id, elementId, { content: newContent });
  }, [card.id, updateElement]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (projectId === "proj-pharma-email" && card.status === "review") return;
    if (!e.dataTransfer.types.includes("application/x-asset-element")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDropTarget(true);
    setDropRejected(false);

    // Compute insertion index from mouse Y relative to element positions
    if (contentRef.current) {
      const children = Array.from(contentRef.current.children).filter(
        (el) => !(el as HTMLElement).dataset.dropIndicator
      );
      const mouseY = e.clientY;
      let idx = children.length; // default: append at end
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (mouseY < midY) {
          idx = i;
          break;
        }
      }
      setDropIndex(idx);
    }
  }, [projectId, card.status]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (dragRef.current && !dragRef.current.contains(e.relatedTarget as Node)) {
      setIsDropTarget(false);
      setDropRejected(false);
      setDropIndex(-1);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (projectId === "proj-pharma-email" && card.status === "review") return;
    e.preventDefault();
    setIsDropTarget(false);
    setDropRejected(false);
    const insertAt = dropIndex;
    setDropIndex(-1);

    const raw = e.dataTransfer.getData("application/x-asset-element");
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as { type: string; content: string; imageData?: { src: string; alt: string } };

      // SMS only accepts body text
      if (card.channel === "sms" && !SMS_ALLOWED_TYPES.has(data.type)) {
        setDropRejected(true);
        setTimeout(() => setDropRejected(false), 800);
        return;
      }

      const newElement: ContentElement = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: data.type as ContentElement["type"],
        content: data.content,
        ...(data.imageData ? { imageData: { ...data.imageData, fit: "cover" as const } } : {}),
      };

      if (insertAt >= 0 && insertAt < card.elements.length) {
        insertElement(card.id, newElement, insertAt);
      } else {
        addElement(card.id, newElement);
      }
    } catch { /* ignore malformed data */ }
  }, [card.id, card.channel, card.status, projectId, addElement, insertElement, dropIndex]);

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute"
      style={{
        left: card.position.x,
        top: card.position.y,
        width: card.size.width,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "relative rounded-lg border-2 transition-all duration-150 overflow-hidden",
          "bg-white content-card-light",
          dropRejected
            ? "border-red-400 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]"
            : isDropTarget
            ? "border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
            : isLockedInReview
            ? "border-amber-400/90 bg-neutral-50/90 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.4)] ring-1 ring-amber-300/50"
            : isSelected && selectedVariantId
            ? "border-[#B3DEFF] shadow-[0_0_0_2px_rgba(1,118,211,0.06)]"
            : isSelected
            ? "border-[#0F8EFF] shadow-[0_0_0_2px_rgba(1,118,211,0.15)]"
            : "border-[var(--border)] hover:border-neutral-400",
          isCardGenerating && !isLazySkeleton && "animate-pulse",
        )}
      >
        {/* Header - draggable area */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]"
          style={{ backgroundColor: channelBgColor[card.channel] ?? "var(--surface-subtle)" }}
        >
          <ContentTypeIcon type={card.channel} size="lg" />
          <div className="flex-1 min-w-0">
            {isLazySkeleton || (isCardGenerating && !card.title.trim()) ? (
              <div className="h-4 max-w-[200px] rounded-md bg-black/[0.08] animate-pulse" />
            ) : (
              <h3 className="text-[14px] font-bold text-[var(--text-primary)] truncate">{card.title}</h3>
            )}
          </div>
          {isLazySkeleton ? (
            <div className="h-5 w-14 rounded-full bg-black/[0.08] animate-pulse flex-shrink-0" />
          ) : (
            <StatusBadge status={card.status} />
          )}
        </div>

        {/* Content - editable area */}
        <div ref={contentRef} className="p-4 space-y-3">
          {card.elements.length === 0 && isCardGenerating ? (
            <div className="space-y-3">
              <div className="h-24 rounded bg-[var(--background)] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[var(--background)] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[var(--background)] animate-pulse" />
            </div>
          ) : (
            <>
              {card.elements.map((element, i) => (
                <div key={element.id}>
                  {isDropTarget && dropIndex === i && (
                    <div data-drop-indicator="true" className="flex items-center gap-1.5 py-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="flex-1 h-0.5 rounded-full bg-emerald-500" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    </div>
                  )}
                  <EditableElement
                    cardId={card.id}
                    element={element}
                    index={i}
                    channel={card.channel}
                    readOnly={isLockedInReview}
                    regulatedClaimsAnchor={regulatedEmailAnchors.claimHintIds.has(element.id)}
                    regulatedFlagAnchor={regulatedEmailAnchors.flagIds.has(element.id)}
                    onChange={(newContent) => handleElementChange(element.id, newContent)}
                  />
                </div>
              ))}
              {isDropTarget && dropIndex >= card.elements.length && (
                <div data-drop-indicator="true" className="flex items-center gap-1.5 py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div className="flex-1 h-0.5 rounded-full bg-emerald-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Generating overlay — skip for lazy skeleton cards (shimmer only) */}
        {isCardGenerating && !isLazySkeleton && (
          <div className="absolute inset-0 bg-[var(--surface)]/60 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] rounded-full shadow-sm border border-[var(--border)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <SpinnerIcon className="w-4 h-4 text-[var(--text-primary)]" />
              </motion.div>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">Generating...</span>
            </div>
          </div>
        )}

        {/* Variant footer — collapsed */}
        {(card.variants?.length ?? 0) > 0 && !variantsExpanded && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-[14px] text-[var(--text-muted)]">
              <VariantsIcon className="w-4 h-4" />
              <span className="font-medium">{variantCount} variants</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setVariantsExpanded(true); }}
              className="flex items-center gap-1 text-[14px] font-semibold text-[#0F8EFF] hover:text-[#0D7DE6] transition-colors"
            >
              Expand Variants
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded variants */}
      <AnimatePresence>
        {variantsExpanded && card.variants && card.variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="px-1 pb-1"
          >
            {card.variants.map((variant, vi) => {
              const isVariantSelected = selectedVariantId === variant.id;
              const variantAnchors =
                projectId === "proj-pharma-email" && card.channel === "email"
                  ? regulatedEmailChromeAnchors(variant.elements)
                  : { claimHintIds: new Set<string>(), flagIds: new Set<string>() };
              return (
              <div
                key={variant.id}
                onClick={(e) => { e.stopPropagation(); selectVariant(card.id, variant.id); }}
                className={cn(
                  "mt-4 rounded-lg border-2 border-dashed border-[var(--border)] bg-white overflow-hidden cursor-pointer transition-all content-card-light",
                  isVariantSelected && "outline outline-2 outline-offset-[4px] outline-[#009CFF] mx-2 mb-2",
                )}
              >
                {/* Variant header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)]"
                  style={{ backgroundColor: channelBgColor[card.channel] ?? "var(--surface-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <ContentTypeIcon type={card.channel} size="sm" />
                    <h3 className="text-[13px] font-bold text-[var(--text-primary)]">{card.title}</h3>
                    <span className="text-[13px] font-medium text-[var(--text-muted)] bg-[var(--surface-active)] px-1.5 py-0.5 rounded">
                      {variant.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={variant.status} />
                    {!isLockedInReview && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeVariant(card.id, variant.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-active)] transition-colors"
                      title="Delete variant"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                    )}
                  </div>
                </div>
                {/* Variant content */}
                <div className="p-4 space-y-3">
                  {variant.elements.map((element, ei) => (
                    <EditableElement
                      key={element.id}
                      cardId={card.id}
                      element={element}
                      index={ei}
                      channel={card.channel}
                      readOnly={isLockedInReview}
                      regulatedClaimsAnchor={variantAnchors.claimHintIds.has(element.id)}
                      regulatedFlagAnchor={variantAnchors.flagIds.has(element.id)}
                      includeComplianceScan={false}
                      onChange={(newContent) => updateVariantElement(card.id, variant.id, element.id, { content: newContent })}
                    />
                  ))}
                </div>
              </div>
            );
            })}

            {/* Variant actions footer */}
            <div className="mt-2 flex items-center gap-2">
              {!isLockedInReview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); addVariant(card.id); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors"
              >
                + add variant
              </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setVariantsExpanded(false); }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <ChevronUpIcon className="w-3.5 h-3.5" />
                collapse variants
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating image variation toolbar — positioned below the image element */}
      <AnimatePresence>
        {activeVariationEl?.imageVariations && isVariationElSelected && variationToolbarTop !== null && (
          <ImageVariationToolbar
            cardId={card.id}
            elementId={activeVariationEl.id}
            variations={activeVariationEl.imageVariations}
            topOffset={variationToolbarTop}
            onSelect={(i) => selectImageVariation(card.id, activeVariationEl!.id, i)}
            onRefresh={() => handleVariationRefresh(activeVariationEl!.id, activeVariationEl!.imageVariations!)}
          />
        )}
      </AnimatePresence>

      {/* Selection indicator */}
      {isSelected && !isDragging && (
        <div className="absolute -top-3 -left-2 z-10">
          <div className="px-2 py-0.5 bg-[#0F8EFF] rounded-md text-[13px] font-semibold text-white shadow-sm">
            Selected
          </div>
        </div>
      )}

      {/* Element side panel — floats to the right of the card when a text element is selected */}
      <AnimatePresence>
        {activeIsTextElement && activeElement && (
          <div className="absolute left-[calc(100%+12px)] z-20 pointer-events-auto" style={{ top: sidePanelTop }}>
            <ElementSidePanel
              actions={[
                {
                  id: "rephrase",
                  label: "Rephrase",
                  icon: <RephraseIcon />,
                  onClick: () => {
                    setRephraseTargetElement(activeElement);
                    setRephraseOpen(true);
                  },
                },
                {
                  id: "see-sources",
                  label: "See sources",
                  icon: <SourcesIcon />,
                  badge: activeSuggestionCount,
                  onClick: () => selectElement(card.id, activeElement.id),
                },
              ]}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Rephrase popup — rendered as portal so it escapes canvas zoom transform */}
      <AnimatePresence>
        {rephraseOpen && rephraseTargetElement && (
          <RephraseElementPopup
            cardId={card.id}
            element={rephraseTargetElement}
            channel={card.channel}
            onClose={() => setRephraseOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Editable Element Component
interface EditableElementProps {
  cardId: string;
  element: ContentElement;
  index: number;
  channel: ChannelType;
  /** When true, show the indigo claim-suggestion count badge (regulated email anchors only). */
  regulatedClaimsAnchor?: boolean;
  /** When true, show the compliance flag control (regulated email anchors only). */
  regulatedFlagAnchor?: boolean;
  /** When false, skip scanner hits for badges (e.g. variant preview vs stored card body). */
  includeComplianceScan?: boolean;
  /** When true, selecting still works but inline editing is disabled (e.g. content in regulatory review). */
  readOnly?: boolean;
  onChange: (newContent: string) => void;
}

function EditableElement({
  cardId,
  element,
  index,
  channel,
  regulatedClaimsAnchor = false,
  regulatedFlagAnchor = false,
  includeComplianceScan = true,
  readOnly = false,
  onChange,
}: EditableElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const isEmail = channel === "email";

  const projectId = useCanvasStore((s) => s.projectId);
  const regulated = projectId === "proj-pharma-email";
  const profile = useRegulatedContentStore((s) => s.profile);
  const dismissedByElement = useRegulatedContentStore((s) => s.dismissedByElement);
  const creatorFlags = useRegulatedContentStore((s) => s.creatorComplianceFlags);

  const ek = elementKey(cardId, element.id);
  const dismissed = dismissedByElement[ek] ?? [];
  const suggestionCount = useMemo(() => {
    if (!regulated || !regulatedClaimsAnchor || element.type === "divider") return 0;
    return filterClaimsForContext({
      profile,
      channel,
      elementType: element.type,
      dismissedIds: dismissed,
    }).length;
  }, [regulated, regulatedClaimsAnchor, element.type, profile, channel, dismissed]);

  const isCreatorFlagged = Boolean(creatorFlags[ek]);
  const showRegulatedChrome = regulated && element.type !== "divider" && regulatedClaimsAnchor;
  const cards = useSimpleCanvasStore((s) => s.cards);

  const hasFlagScanIssue = useMemo(() => {
    if (!regulated || !regulatedFlagAnchor || !includeComplianceScan) return false;
    return scanCardsForCompliance(cards, profile, creatorFlags).some(
      (i) => i.cardId === cardId && i.elementId === element.id,
    );
  }, [regulated, regulatedFlagAnchor, includeComplianceScan, cards, profile, creatorFlags, cardId, element.id]);

  const showComplianceFlagBadge =
    regulated && regulatedFlagAnchor && element.type !== "divider" && (isCreatorFlagged || hasFlagScanIssue);

  const { selectedElement, selectElement, clearImageVariations } = useSimpleCanvasStore();
  const compliancePulseKey = useSimpleCanvasStore((s) => s.compliancePulseKey);
  const isImageSelected = selectedElement?.cardId === cardId && selectedElement?.elementId === element.id;
  const isElementSelected = selectedElement?.cardId === cardId && selectedElement?.elementId === element.id;
  const isTextElement = element.type === "headline" || element.type === "body" || element.type === "cta";

  useEffect(() => {
    if (!isImageSelected && element.imageVariations && !element.imageVariations.isRefreshing) {
      clearImageVariations(cardId, element.id);
    }
  }, [isImageSelected, cardId, element.id, element.imageVariations, clearImageVariations]);

  // Sync edit value when element content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(element.content);
    }
  }, [element.content, isEditing]);

  // Single click on text elements: select only, show action menu without entering edit mode
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(cardId, element.id);
  };

  // Double-click on text elements (or single click on images): enters inline edit / image panel
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === "divider") return;
    selectElement(cardId, element.id);

    if (readOnly) return;

    if (element.type === "image") return;

    setIsEditing(true);
    setEditValue(element.content);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (editValue.trim() !== element.content) {
      onChange(editValue.trim());
    }
  };

  // Click outside to deselect
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        handleFinishEdit();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isEditing, editValue, element.content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditValue(element.content);
      setIsEditing(false);
    }
    if (e.key === "Enter" && !e.shiftKey && element.type !== "body") {
      e.preventDefault();
      handleFinishEdit();
    }
  };

  // Focus input when editing starts + auto-resize textarea
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Auto-resize textarea on content change
  useEffect(() => {
    if (isEditing && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [editValue, isEditing]);

  const imageFit = element.imageData?.fit || "cover";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      data-editable
      data-element-id={element.id}
      className={cn(
        "relative transition-all duration-150",
        showRegulatedChrome && "pl-10",
        // Element selected — dashed blue outline (distinguishes from solid card-level selection)
        isElementSelected && isTextElement &&
          "rounded-md outline outline-2 outline-[#0F8EFF] [outline-style:dashed] outline-offset-2 bg-blue-50/30",
        regulated &&
          element.type !== "divider" &&
          (compliancePulseKey === ek ||
            (regulatedFlagAnchor && (isCreatorFlagged || hasFlagScanIssue))) &&
          "rounded-lg ring-2 ring-amber-500 ring-offset-2 ring-offset-white",
        regulated && element.type !== "divider" && compliancePulseKey === ek && "animate-[pulse_1.1s_ease-in-out_2]",
      )}
    >
      {(showComplianceFlagBadge ||
        (showRegulatedChrome && regulatedClaimsAnchor && suggestionCount > 0)) && (
        <div className="pointer-events-none absolute -right-0.5 -top-1 z-[30] flex flex-row-reverse items-center gap-1">
          {showRegulatedChrome && regulatedClaimsAnchor && suggestionCount > 0 && (
            <div
              className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
              title="Claim suggestions for this block — open the inspector to insert approved copy"
              aria-label={`${suggestionCount} regulatory claim suggestions`}
            >
              {suggestionCount > 9 ? "9+" : suggestionCount}
            </div>
          )}
          {showComplianceFlagBadge && (
            <div
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-amber-600 text-white shadow-md ring-2 ring-white"
              title="Compliance review — see flags in the inspector"
              aria-label="Compliance flag on this block"
            >
              <ComplianceFlagIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      )}
      {element.type === "image" && (
        element.isLoading ? (
          <div className="relative rounded overflow-hidden h-36 bg-[var(--surface-active)] shimmer" aria-hidden />
        ) : (
        <>
        <div
          onClick={handleStartEdit}
          data-image-variation-anchor={element.imageVariations ? "true" : undefined}
          className={cn(
            "group relative rounded overflow-hidden transition-all border-2",
            readOnly ? "cursor-default" : "cursor-pointer",
            isImageSelected
              ? "border-[#0F8EFF] ring-2 ring-[#0F8EFF]/20"
              : "border-transparent",
            !element.imageData?.src && "h-36 bg-[var(--surface-subtle)] flex items-center justify-center"
          )}
          title={readOnly ? "View only (in review)" : "Click to edit image"}
        >
          {element.imageData?.src ? (
            <>
              <img
                src={element.imageData.src}
                alt={element.imageData.alt || element.content}
                className={cn(
                  "w-full",
                  imageFit === "cover" ? "h-36 object-cover" : "h-36 object-contain",
                  element.imageVariations?.isRefreshing && "opacity-40"
                )}
                draggable={false}
              />
              {element.imageVariations?.isRefreshing && (
                <div className="absolute inset-0 bg-[var(--surface-active)] shimmer" />
              )}
              {!element.imageVariations && !readOnly && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-150 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="w-5 h-5 text-white" />
                    <span className="text-[13px] font-medium text-white">Click to edit</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-[var(--text-muted)]">
              <div className="w-8 h-8 rounded-full bg-[#E8E8E8] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
              <span className="text-[13px] font-medium">Add Image</span>
            </div>
          )}
        </div>
        </>
        )
      )}

      {element.type === "headline" && (
        element.isLoading ? (
          <div className="space-y-1.5 py-1 animate-pulse">
            <div className={cn("h-4 rounded-md bg-[var(--surface-active)]", isEmail ? "w-3/4" : "w-2/3")} />
          </div>
        ) : isEditing ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full font-bold text-[var(--text-primary)] bg-transparent rounded px-2 py-1 -mx-2 -my-1 outline-none ring-2 ring-inset ring-[#0F8EFF]",
              isEmail ? "text-[16px]" : "text-[14px]"
            )}
          />
        ) : (
          <h4
            onClick={handleSelect}
            onDoubleClick={readOnly ? undefined : handleStartEdit}
            className={cn(
              "font-bold text-[var(--text-primary)] rounded px-2 py-1 -mx-2 -my-1",
              isEmail ? "text-[16px]" : "text-[14px]",
              readOnly ? "cursor-default" : "cursor-default transition-colors hover:bg-[var(--background)]",
            )}
            title={readOnly ? undefined : "Double-click to edit"}
          >
            {element.content}
          </h4>
        )
      )}

      {element.type === "body" && (
        element.isLoading ? (
          <div className="space-y-1.5 py-1 animate-pulse">
            <div className="h-3 rounded-md bg-[var(--surface-active)] w-full" />
            <div className="h-3 rounded-md bg-[var(--surface-active)] w-5/6" />
            <div className="h-3 rounded-md bg-[var(--surface-active)] w-4/6" />
          </div>
        ) : isEditing ? (
          <div className="-mx-2 -my-1">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => {
                const v = e.target.value;
                if (!isEmail && v.length > SMS_MAX_CHARS) return;
                setEditValue(v);
              }}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              maxLength={isEmail ? undefined : SMS_MAX_CHARS}
              className={cn(
                "w-full text-[var(--text-muted)] bg-transparent rounded px-2 py-1 outline-none ring-2 ring-inset resize-none overflow-hidden",
                isEmail ? "text-[13px] leading-relaxed ring-[#0F8EFF]" : "text-[13px] leading-snug",
                !isEmail && editValue.length >= SMS_MAX_CHARS ? "ring-red-500" : !isEmail ? "ring-[#0F8EFF]" : ""
              )}
            />
            {!isEmail && (
              <div className="flex items-center justify-between mt-1 px-1">
                <span className={cn(
                  "text-[13px] tabular-nums font-medium",
                  editValue.length >= SMS_MAX_CHARS ? "text-red-500" : editValue.length >= 140 ? "text-amber-500" : "text-[var(--text-muted)]"
                )}>
                  {editValue.length} / {SMS_MAX_CHARS}
                </span>
                {editValue.length >= SMS_MAX_CHARS && (
                  <span className="text-[13px] text-red-500 font-medium">Limit reached</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p
            onClick={handleSelect}
            onDoubleClick={readOnly ? undefined : handleStartEdit}
            className={cn(
              "text-[var(--text-muted)] whitespace-pre-line rounded px-2 py-1 -mx-2 -my-1",
              isEmail ? "text-[13px] leading-relaxed" : "text-[13px] leading-snug",
              readOnly ? "cursor-default" : "cursor-default transition-colors hover:bg-[var(--background)]",
            )}
            title={readOnly ? undefined : "Double-click to edit"}
          >
            {element.content}
          </p>
        )
      )}

      {element.type === "cta" && (
        element.isLoading ? (
          <div className="animate-pulse">
            <div className={cn("h-9 rounded bg-[var(--surface-active)]", isEmail ? "w-32" : "w-24")} />
          </div>
        ) : isEmail ? (
          isEditing ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              className="font-bold text-white rounded px-4 py-2 outline-none ring-2 ring-[#0F8EFF] text-[13px] bg-neutral-900"
            />
          ) : (
            <div
              onClick={handleSelect}
              onDoubleClick={readOnly ? undefined : handleStartEdit}
              className={cn(
                "inline-block px-4 py-2 rounded font-bold text-white text-[13px] bg-neutral-900",
                readOnly ? "cursor-default" : "cursor-default transition-opacity hover:opacity-80",
              )}
              title={readOnly ? undefined : "Double-click to edit"}
            >
              {element.content}
            </div>
          )
        ) : isEditing ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-[13px] text-[var(--text-muted)] italic bg-transparent rounded px-2 py-1 -mx-2 -my-1 outline-none ring-2 ring-inset ring-[#0F8EFF]"
          />
        ) : (
          <p
            onClick={handleSelect}
            onDoubleClick={readOnly ? undefined : handleStartEdit}
            className={cn(
              "text-[13px] text-[var(--text-muted)] italic rounded px-2 py-1 -mx-2 -my-1",
              readOnly ? "cursor-default" : "cursor-default transition-colors hover:bg-[var(--background)]",
            )}
            title={readOnly ? undefined : "Double-click to edit"}
          >
            {element.content}
          </p>
        )
      )}

      {element.type === "divider" && (
        <div className="h-px bg-[var(--border-subtle)]" />
      )}
    </motion.div>
  );
}

// Image Variation Toolbar (Photoshop-style generative options)
interface ImageVariationToolbarProps {
  cardId: string;
  elementId: string;
  variations: NonNullable<import("@/types/simple-canvas").ContentElement["imageVariations"]>;
  topOffset: number;
  onSelect: (index: number) => void;
  onRefresh: () => void;
}

function ImageVariationToolbar({ variations, topOffset, onSelect, onRefresh }: ImageVariationToolbarProps) {
  const { options, selectedIndex, isRefreshing } = variations;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute left-0 right-0 flex justify-center z-20"
      style={{ top: topOffset + 6 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg shadow-black/10">
        {/* Left arrow */}
          <button
          type="button"
          onClick={() => !isRefreshing && onSelect((selectedIndex - 1 + options.length) % options.length)}
          disabled={isRefreshing}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 flex-shrink-0",
            isRefreshing
              ? "text-[var(--text-muted)] cursor-default"
              : "text-[var(--text-muted)] hover:bg-[#E8E8E8] hover:text-[var(--text-primary)] cursor-pointer"
          )}
          title="Previous option"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>

        {/* Thumbnails */}
        <div className="flex items-center gap-1">
          {options.map((opt, i) => (
            <button
              key={`${opt.src}-${i}`}
              type="button"
              onClick={() => !isRefreshing && onSelect(i)}
              className={cn(
                "relative w-[36px] h-[36px] rounded-md overflow-hidden border-2 transition-all duration-150 flex-shrink-0",
                isRefreshing
                  ? "border-transparent cursor-default"
                  : i === selectedIndex
                    ? "border-[#0F8EFF] ring-1 ring-[#0F8EFF]/25 shadow-sm"
                    : "border-transparent hover:border-[#CCC] cursor-pointer"
              )}
              title={isRefreshing ? "Generating..." : `Option ${i + 1}`}
            >
              {isRefreshing ? (
                <div className="w-full h-full bg-[var(--surface-active)] shimmer" />
              ) : (
                <img
                  src={opt.src}
                  alt={opt.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right arrow */}
          <button
          type="button"
          onClick={() => !isRefreshing && onSelect((selectedIndex + 1) % options.length)}
          disabled={isRefreshing}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 flex-shrink-0",
            isRefreshing
              ? "text-[var(--text-muted)] cursor-default"
              : "text-[var(--text-muted)] hover:bg-[#E8E8E8] hover:text-[var(--text-primary)] cursor-pointer"
          )}
          title="Next option"
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        {/* Counter */}
        <span className={cn(
          "text-[11px] font-medium tabular-nums select-none",
          isRefreshing ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"
        )}>
          {isRefreshing ? "—" : selectedIndex + 1}/{options.length}
        </span>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        {/* Refresh button */}
          <button
          type="button"
          onClick={() => !isRefreshing && onRefresh()}
          disabled={isRefreshing}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 flex-shrink-0",
            isRefreshing
              ? "text-[var(--text-muted)] cursor-default"
              : "text-[var(--text-muted)] hover:bg-[#E8E8E8] hover:text-[var(--text-primary)] cursor-pointer"
          )}
          title="Generate new options"
        >
          <RefreshIcon className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
        </button>
      </div>
    </motion.div>
  );
}

// Icons
function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function VariantsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="6" rx="1.5" />
      <rect x="2" y="14" width="20" height="6" rx="1.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
