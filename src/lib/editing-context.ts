import type { ContentGroup, AtomicBlock, ChannelType } from "@/types/workspace";
import type { FocusedChannelRef } from "@/stores/workspace";

const channelLabel: Record<ChannelType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  rcs: "RCS",
  web: "Web",
};

const blockLabel: Record<AtomicBlock["type"], string> = {
  image: "Image",
  headline: "Headline",
  body: "Body",
  cta: "CTA",
  section: "Section",
  divider: "Divider",
  disclaimer: "Disclaimer",
  token: "Token",
  language: "Language",
};

/**
 * Human-readable scope for the command bar and agent prompts.
 */
export function getEditingContextLabel(
  groups: ContentGroup[],
  atomicBlocks: AtomicBlock[],
  selectedIds: string[],
  focusedChannel: FocusedChannelRef | null,
): string {
  if (focusedChannel) {
    const g = groups.find((x) => x.id === focusedChannel.groupId);
    const ch = g?.channels.find((c) => c.id === focusedChannel.channelId);
    if (g && ch) {
      return `${channelLabel[ch.channel]} (${g.name})`;
    }
  }

  if (selectedIds.length === 0 && !focusedChannel) {
    return "Entire campaign";
  }

  if (selectedIds.length === 1) {
    const g = groups.find((x) => x.id === selectedIds[0]);
    if (g) return g.name;
    const b = atomicBlocks.find((x) => x.id === selectedIds[0]);
    if (b) return blockLabel[b.type] ?? b.type;
  }

  return `${selectedIds.length} items`;
}

/** Node ids on canvas that should show agent activity for the current scope. */
export function getAgentScopeCanvasIds(
  groups: ContentGroup[],
  atomicBlocks: AtomicBlock[],
  selectedIds: string[],
  focusedChannel: FocusedChannelRef | null,
): string[] {
  if (focusedChannel) {
    const g = groups.find((x) => x.id === focusedChannel.groupId);
    const ch = g?.channels.find((c) => c.id === focusedChannel.channelId);
    if (!g || !ch) return [focusedChannel.groupId];
    return [g.id, ...ch.atomicBlocks];
  }

  if (selectedIds.length === 0) {
    return [...groups.map((g) => g.id), ...atomicBlocks.map((b) => b.id)];
  }

  if (selectedIds.length === 1) {
    const g = groups.find((x) => x.id === selectedIds[0]);
    if (g) {
      const blockIds = new Set<string>();
      for (const ch of g.channels) {
        ch.atomicBlocks.forEach((id) => blockIds.add(id));
      }
      return [g.id, ...blockIds];
    }
    const b = atomicBlocks.find((x) => x.id === selectedIds[0]);
    if (b) return [b.id];
  }

  return [...selectedIds];
}
