"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/cn";

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

export function MiniMap() {
  const { viewport, cards, cardGroups, hiddenCardIds, selectedCardId, selectedCardIds, selectedGroupId } = useSimpleCanvasStore();
  const isDark = useThemeStore((s) => s.resolvedTheme === "dark");

  const rightPanelOpen = !!(selectedGroupId || selectedCardIds.length > 1 || selectedCardId);

  const visibleCards = useMemo(
    () => cards.filter((c) => !hiddenCardIds.has(c.id)),
    [cards, hiddenCardIds],
  );

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const c of visibleCards) {
      minX = Math.min(minX, c.position.x);
      minY = Math.min(minY, c.position.y);
      maxX = Math.max(maxX, c.position.x + c.size.width);
      maxY = Math.max(maxY, c.position.y + c.size.height);
    }

    for (const g of cardGroups) {
      minX = Math.min(minX, g.position.x);
      minY = Math.min(minY, g.position.y);
      maxX = Math.max(maxX, g.position.x + g.size.width);
      maxY = Math.max(maxY, g.position.y + g.size.height);
    }

    const padding = 100;
    const hasContent = visibleCards.length > 0 || cardGroups.length > 0;
    const rawW = maxX - minX + padding * 2;
    const rawH = maxY - minY + padding * 2;

    if (!hasContent || !Number.isFinite(rawW) || !Number.isFinite(rawH) || rawW <= 0 || rawH <= 0) {
      return { minX: 0, minY: 0, width: 1200, height: 800 };
    }

    return {
      minX: minX - padding,
      minY: minY - padding,
      width: rawW,
      height: rawH,
    };
  }, [visibleCards, cardGroups]);

  const scale = Math.min(MINIMAP_WIDTH / bounds.width, MINIMAP_HEIGHT / bounds.height) * 0.9;

  const toMinimap = useCallback(
    (x: number, y: number) => ({
      x: (x - bounds.minX) * scale,
      y: (y - bounds.minY) * scale,
    }),
    [bounds, scale],
  );

  const [screenSize, setScreenSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const update = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const viewportRect = useMemo(() => {
    const z = Number.isFinite(viewport.zoom) && viewport.zoom > 0 ? viewport.zoom : 1;
    const worldX = -viewport.x / z;
    const worldY = -viewport.y / z;
    const posX = (worldX - bounds.minX) * scale;
    const posY = (worldY - bounds.minY) * scale;
    const w = (screenSize.w / z) * scale;
    const h = (screenSize.h / z) * scale;
    return {
      x: Number.isFinite(posX) ? posX : 0,
      y: Number.isFinite(posY) ? posY : 0,
      width: Number.isFinite(w) ? Math.max(w, 2) : 2,
      height: Number.isFinite(h) ? Math.max(h, 2) : 2,
    };
  }, [viewport, scale, bounds, screenSize]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const worldX = clickX / scale + bounds.minX;
      const worldY = clickY / scale + bounds.minY;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const z = viewport.zoom;

      useSimpleCanvasStore.setState({
        viewport: {
          ...viewport,
          x: -(worldX - screenWidth / (2 * z)) * z,
          y: -(worldY - screenHeight / (2 * z)) * z,
        },
      });
    },
    [scale, bounds, viewport],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className={cn(
        "absolute bottom-4 rounded-lg backdrop-blur-sm border shadow-sm overflow-hidden cursor-crosshair z-10 transition-[right] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isDark
          ? "bg-[#1c1c1e]/90 border-[var(--border)]"
          : "bg-white/90 border-[#DDD]",
      )}
      style={{ right: rightPanelOpen ? 320 : 16, width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={handleClick}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)"
            : "radial-gradient(circle at 1px 1px, #ccc 1px, transparent 0)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Group frames */}
      {cardGroups.map((group) => {
        const pos = toMinimap(group.position.x, group.position.y);
        return (
          <div
            key={group.id}
            className={cn(
              "absolute rounded-[1px] border",
              isDark ? "bg-blue-500/15 border-blue-400/25" : "bg-blue-100/50 border-blue-300/40",
            )}
            style={{
              left: pos.x,
              top: pos.y,
              width: Math.max(group.size.width * scale, 3),
              height: Math.max(group.size.height * scale, 3),
            }}
          />
        );
      })}

      {/* Cards */}
      {visibleCards.map((card) => {
        const pos = toMinimap(card.position.x, card.position.y);
        return (
          <div
            key={card.id}
            className={cn(
              "absolute rounded-[1px]",
              isDark ? "bg-neutral-400/50" : "bg-neutral-400/80",
            )}
            style={{
              left: pos.x,
              top: pos.y,
              width: Math.max(card.size.width * scale, 2),
              height: Math.max(card.size.height * scale, 2),
            }}
          />
        );
      })}

      {/* Viewport indicator */}
      <div
        className="absolute border-[1.5px] border-[#0F8EFF] bg-[#0F8EFF]/8 rounded-[1px] transition-all duration-75"
        style={{
          left: viewportRect.x,
          top: viewportRect.y,
          width: viewportRect.width,
          height: viewportRect.height,
        }}
      />
    </motion.div>
  );
}
