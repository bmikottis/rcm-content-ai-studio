"use client";

import { useMemo } from "react";
import type { AtomicBlock, ContentGroup, ChannelVariant } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/cn";

export type ResolvedAttachment =
  | {
      kind: "channel";
      key: string;
      groupId: string;
      groupName: string;
      groupColor: string;
      channel: ChannelVariant;
    }
  | { kind: "group"; key: string; groupId: string; groupName: string; groupColor: string }
  | { kind: "unknown"; key: string; id: string };

function channelLabel(ch: ChannelVariant): string {
  return ch.displayName?.trim() || ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1);
}

export function resolveBlockAttachments(
  groups: ContentGroup[],
  block: AtomicBlock,
): ResolvedAttachment[] {
  const ids = block.linkedTo;
  if (!ids?.length) return [];

  const out: ResolvedAttachment[] = [];
  for (const id of ids) {
    let channelHit: { group: ContentGroup; channel: ChannelVariant } | null = null;
    for (const g of groups) {
      const ch = g.channels.find((c) => c.id === id);
      if (ch) {
        channelHit = { group: g, channel: ch };
        break;
      }
    }
    if (channelHit) {
      out.push({
        kind: "channel",
        key: `ch-${id}`,
        groupId: channelHit.group.id,
        groupName: channelHit.group.name,
        groupColor: channelHit.group.color,
        channel: channelHit.channel,
      });
      continue;
    }

    const groupOnly = groups.find((g) => g.id === id);
    if (groupOnly) {
      out.push({
        kind: "group",
        key: `grp-${id}`,
        groupId: groupOnly.id,
        groupName: groupOnly.name,
        groupColor: groupOnly.color,
      });
      continue;
    }

    out.push({ kind: "unknown", key: `unk-${id}`, id });
  }
  return out;
}

type BlockAttachmentsPanelProps = {
  block: AtomicBlock;
  /** Card with title — for fragment drill-down. */
  variant?: "inline" | "card";
  className?: string;
};

/**
 * Lists channels / campaigns this atomic block is linked to (`linkedTo`), with optional navigation.
 */
export function BlockAttachmentsPanel({ block, variant = "inline", className }: BlockAttachmentsPanelProps) {
  const groups = useWorkspaceStore((s) => s.groups);
  const enterChannel = useWorkspaceStore((s) => s.enterChannel);
  const select = useWorkspaceStore((s) => s.select);
  const focusViewportOnGroup = useWorkspaceStore((s) => s.focusViewportOnGroup);

  const items = useMemo(() => resolveBlockAttachments(groups, block), [groups, block]);

  const list = (
    <>
      {items.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-[#7A7A7A]">
          Not linked to any channels yet. Use the{" "}
          <span className="font-medium text-neutral-600">Links</span> tool in the left sidebar to connect this
          block to channel variants.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            if (item.kind === "channel") {
              const label = `${item.groupName} · ${channelLabel(item.channel)}`;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      enterChannel(item.groupId, item.channel.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-neutral-100"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.groupColor }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-[13px] font-medium text-neutral-800">{label}</span>
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#7A7A7A]">
                      Open
                    </span>
                  </button>
                </li>
              );
            }
            if (item.kind === "group") {
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      select([item.groupId]);
                      focusViewportOnGroup(item.groupId);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-neutral-100"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.groupColor }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-[13px] font-medium text-neutral-800">
                      Campaign · {item.groupName}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#7A7A7A]">
                      Focus
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li
                key={item.key}
                className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[13px] text-neutral-500"
              >
                <span className="font-mono text-[13px] text-[#7A7A7A]">{item.id}</span>
                <span className="text-[#7A7A7A]">— unresolved reference</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "mb-4 rounded-lg border border-[#DDD] bg-neutral-50/90 px-3 py-2.5",
          className,
        )}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Attached to</p>
        {list}
      </div>
    );
  }

  return <div className={className}>{list}</div>;
}
