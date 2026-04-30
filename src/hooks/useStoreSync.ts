"use client";

import { useEffect, useRef } from "react";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Bidirectional content sync between SimpleCanvas cards and Workspace atomic blocks.
 *
 * Mapping (by channel type + element type):
 *   email-card elements  ↔  ch-email atomic blocks
 *   sms-card elements    ↔  ch-sms atomic blocks
 *
 * When one store changes, we push matching content updates to the other.
 * A guard flag prevents infinite ping-pong.
 */
export function useStoreSync() {
  const syncing = useRef(false);

  // Subscribe to SimpleCanvas changes → push to Workspace
  useEffect(() => {
    const unsub = useSimpleCanvasStore.subscribe((state, prev) => {
      if (syncing.current) return;
      if (state.cards === prev.cards) return;

      syncing.current = true;
      try {
        const ws = useWorkspaceStore.getState();
        for (const card of state.cards) {
          // Find the first workspace channel matching this card's channel type
          for (const group of ws.groups) {
            const channel = group.channels.find((ch) => ch.channel === card.channel);
            if (!channel) continue;
            const atomIds = channel.atomicBlocks;
            const atoms = atomIds
              .map((id) => ws.atomicBlocks.find((a) => a.id === id))
              .filter(Boolean) as typeof ws.atomicBlocks;

            for (const element of card.elements) {
              // Match by type: headline→headline, body→body, cta→cta, image→image
              const matchingAtom = atoms.find((a) => a.type === element.type);
              if (matchingAtom && matchingAtom.content !== element.content) {
                ws.updateAtomicBlock(matchingAtom.id, { content: element.content });
              }
            }
            break; // only match first channel of this type
          }
        }
      } finally {
        syncing.current = false;
      }
    });
    return unsub;
  }, []);

  // Subscribe to Workspace changes → push to SimpleCanvas
  useEffect(() => {
    const unsub = useWorkspaceStore.subscribe((state, prev) => {
      if (syncing.current) return;
      if (state.atomicBlocks === prev.atomicBlocks) return;

      syncing.current = true;
      try {
        const sc = useSimpleCanvasStore.getState();
        for (const card of sc.cards) {
          for (const group of state.groups) {
            const channel = group.channels.find((ch) => ch.channel === card.channel);
            if (!channel) continue;
            const atomIds = channel.atomicBlocks;
            const atoms = atomIds
              .map((id) => state.atomicBlocks.find((a) => a.id === id))
              .filter(Boolean) as typeof state.atomicBlocks;

            for (const element of card.elements) {
              const matchingAtom = atoms.find((a) => a.type === element.type);
              if (matchingAtom && matchingAtom.content !== element.content) {
                sc.updateElement(card.id, element.id, { content: matchingAtom.content });
              }
            }
            break;
          }
        }
      } finally {
        syncing.current = false;
      }
    });
    return unsub;
  }, []);
}
