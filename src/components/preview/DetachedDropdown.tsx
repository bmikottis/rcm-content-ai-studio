"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const Z_BACKDROP = 7000; // matches --z-dropdown
const Z_PANEL = 7001;

type DetachedDropdownProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  maxHeight?: number;
  className?: string;
};

/**
 * Portal + fixed positioning: avoids overflow clipping and flips above when space below is tight.
 */
export function DetachedDropdown({
  open,
  onClose,
  triggerRef,
  children,
  maxHeight = 280,
  className,
}: DetachedDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>(() => ({ visibility: "hidden" }));

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const edge = 12;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const spaceBelow = vh - rect.bottom - gap - edge;
      const spaceAbove = rect.top - gap - edge;
      const openDown = spaceBelow >= 140 || spaceBelow >= spaceAbove;
      const available = openDown ? spaceBelow : spaceAbove;
      const maxH = Math.max(100, Math.min(maxHeight, available));
      const width = rect.width;
      // Prefer right-aligning to the trigger so the dropdown doesn't overflow left
      const rightEdge = rect.right;
      const left = Math.max(edge, Math.min(rightEdge - width, vw - width - edge));

      if (openDown) {
        setPanelStyle({
          position: "fixed",
          top: rect.bottom + gap,
          left,
          minWidth: width,
          width,
          maxHeight: maxH,
          overflowY: "auto",
          visibility: "visible",
        });
      } else {
        setPanelStyle({
          position: "fixed",
          left,
          minWidth: width,
          width,
          maxHeight: maxH,
          overflowY: "auto",
          bottom: vh - rect.top + gap,
          visibility: "visible",
        });
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, triggerRef, maxHeight]);

  useLayoutEffect(() => {
    if (!open) return;
    const onScroll = () => onClose();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: Z_BACKDROP }}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="listbox"
        className={cn(
          "rounded-lg border border-[#DDD] bg-white shadow-lg",
          className,
        )}
        style={{ ...panelStyle, zIndex: Z_PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
