import type { AtomicBlock, ChannelVariant, ContentGroup } from "@/types/workspace";
import type { ContentBlock } from "@/types/canvas";

const PREVIEW_CHANNEL = new Set<string>(["email", "sms", "whatsapp"]);

export type PreviewTouchpoint = {
  /** Stable id — same as workspace channel id */
  key: string;
  groupId: string;
  groupName: string;
  channel: ChannelVariant;
  content: ContentBlock;
};

function atomsForChannel(channel: ChannelVariant, allAtoms: AtomicBlock[]): AtomicBlock[] {
  return channel.atomicBlocks
    .map((id) => allAtoms.find((a) => a.id === id))
    .filter((a): a is AtomicBlock => Boolean(a));
}

/**
 * Builds a {@link ContentBlock} for preview from the same channel + fragments shown on the canvas.
 */
export function channelVariantToContentBlock(
  channel: ChannelVariant,
  allAtoms: AtomicBlock[],
): ContentBlock | null {
  if (!PREVIEW_CHANNEL.has(channel.channel)) return null;

  const atoms = atomsForChannel(channel, allAtoms);
  const headline = atoms.find((a) => a.type === "headline")?.content ?? "";
  const bodyParts = atoms.filter((a) => a.type === "body").map((a) => a.content);
  const bodyJoined = bodyParts.join("\n\n").trim();
  const ctaAtom = atoms.find((a) => a.type === "cta");
  const ctaText = ctaAtom?.content ?? "Learn more";
  const img = atoms.find((a) => a.type === "image");

  const ch = channel.channel as "email" | "sms" | "whatsapp";

  let body = bodyJoined;
  if (ch === "sms") {
    body = bodyJoined || [headline, ctaText].filter(Boolean).join(" — ");
  } else if (!body) {
    body = headline || " ";
  }

  const base: Omit<ContentBlock, "image" | "characterCount"> = {
    id: channel.id,
    channel: ch,
    headline,
    body,
    cta: { text: ctaText, url: "#" },
    personalization: [],
    brandCompliance: channel.status === "approved" ? 96 : channel.status === "ready" ? 90 : 72,
    generatedAt: new Date(),
  };

  if (ch === "email" || ch === "whatsapp") {
    return {
      ...base,
      image: img
        ? {
            id: img.id,
            placeholder: img.content,
            aspectRatio: ch === "whatsapp" ? "1:1" : "16:9",
            altText: img.content,
          }
        : null,
    };
  }

  return {
    ...base,
    image: null,
    characterCount: body.length,
  };
}

/** Same order as canvas: groups array order, then channels within each group. */
export function buildPreviewTouchpoints(groups: ContentGroup[], atomicBlocks: AtomicBlock[]): PreviewTouchpoint[] {
  const out: PreviewTouchpoint[] = [];
  for (const g of groups) {
    for (const ch of g.channels) {
      const content = channelVariantToContentBlock(ch, atomicBlocks);
      if (!content) continue;
      out.push({
        key: ch.id,
        groupId: g.id,
        groupName: g.name,
        channel: ch,
        content,
      });
    }
  }
  return out;
}
