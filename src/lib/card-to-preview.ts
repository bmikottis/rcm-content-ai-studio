import type { ChannelCard, CardVariant, ContentElement } from "@/types/simple-canvas";
import type { ContentBlock, MockImage } from "@/types/canvas";
import type { PreviewTouchpoint } from "@/lib/preview-from-workspace";
import type { ChannelVariant } from "@/types/workspace";

/**
 * Convert a SimpleCanvas ChannelCard → a ContentBlock for preview/code rendering.
 */
export function cardToContentBlock(card: ChannelCard): ContentBlock {
  const headlines = card.elements.filter((e) => e.type === "headline");
  const bodies = card.elements.filter((e) => e.type === "body");
  const ctas = card.elements.filter((e) => e.type === "cta");
  const images = card.elements.filter((e) => e.type === "image");

  const headline = headlines.map((h) => h.content).join(" — ") || card.title;
  const body = bodies.map((b) => b.content).join("\n\n");
  const ctaText = ctas[0]?.content ?? "Learn more";

  const firstImage = images[0];
  const image: MockImage | null = firstImage
    ? {
        id: firstImage.id,
        placeholder: firstImage.imageData?.src || firstImage.content,
        aspectRatio: "16:9",
        altText: firstImage.imageData?.alt || firstImage.content,
      }
    : null;

  return {
    id: card.id,
    channel: card.channel,
    headline,
    body,
    image,
    cta: { text: ctaText, url: "#" },
    personalization: [],
    brandCompliance: card.status === "ready" ? 92 : 72,
    generatedAt: new Date(),
    ...(card.channel === "sms" ? { characterCount: body.length } : {}),
  };
}

/**
 * Convert a CardVariant's elements → a ContentBlock for preview, using the parent card's metadata.
 */
export function variantToContentBlock(card: ChannelCard, variant: CardVariant): ContentBlock {
  const headlines = variant.elements.filter((e) => e.type === "headline");
  const bodies = variant.elements.filter((e) => e.type === "body");
  const ctas = variant.elements.filter((e) => e.type === "cta");
  const images = variant.elements.filter((e) => e.type === "image");

  const headline = headlines.map((h) => h.content).join(" — ") || `${card.title} — ${variant.label}`;
  const body = bodies.map((b) => b.content).join("\n\n");
  const ctaText = ctas[0]?.content ?? "Learn more";

  const firstImage = images[0];
  const image: MockImage | null = firstImage
    ? {
        id: firstImage.id,
        placeholder: firstImage.imageData?.src || firstImage.content,
        aspectRatio: "16:9",
        altText: firstImage.imageData?.alt || firstImage.content,
      }
    : null;

  return {
    id: variant.id,
    channel: card.channel,
    headline,
    body,
    image,
    cta: { text: ctaText, url: "#" },
    personalization: [],
    brandCompliance: variant.status === "ready" ? 92 : 72,
    generatedAt: new Date(),
    ...(card.channel === "sms" ? { characterCount: body.length } : {}),
  };
}

/**
 * Build PreviewTouchpoint objects from SimpleCanvas cards so that
 * PreviewView / CodeView can display them without the workspace store.
 */
export function buildCardTouchpoints(cards: ChannelCard[]): PreviewTouchpoint[] {
  return cards.map((card) => {
    const fakeChannel: ChannelVariant = {
      id: card.id,
      channel: card.channel,
      displayName: card.title,
      position: card.position,
      atomicBlocks: card.elements.map((e) => e.id),
      status: card.status === "ready" ? "ready" : card.status === "published" ? "approved" : "draft",
    };

    return {
      key: card.id,
      groupId: "campaign-group",
      groupName: "Steak Frites Collection",
      channel: fakeChannel,
      content: cardToContentBlock(card),
    };
  });
}

/**
 * Generate complete email HTML from a ChannelCard's elements.
 * Handles logos, multiple images, multiple body sections, dividers, and multiple CTAs.
 */
export function cardToHtml(card: ChannelCard): string {
  const lines: string[] = [];
  const esc = escapeHtml;

  lines.push(`<!DOCTYPE html>`);
  lines.push(`<html lang="en">`);
  lines.push(`<head>`);
  lines.push(`  <meta charset="UTF-8" />`);
  lines.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`);
  lines.push(`  <title>${esc(card.subjectLine || card.title)}</title>`);
  lines.push(`  <style>`);
  lines.push(`    body { margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; color: #1a1a1a; }`);
  lines.push(`    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }`);
  lines.push(`    .section { padding: 0 32px; }`);
  lines.push(`    .section-padded { padding: 20px 32px; }`);
  lines.push(`    h1 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; line-height: 1.3; }`);
  lines.push(`    p { font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 14px; }`);
  lines.push(`    .hero-image { width: 100%; display: block; }`);
  lines.push(`    .logo { display: block; margin: 24px auto 20px; height: 32px; }`);
  lines.push(`    .divider { border: none; border-top: 1px solid #e5e5e5; margin: 24px 32px; }`);
  lines.push(`    .cta-button { display: inline-block; padding: 14px 32px; background: #1a1a1a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }`);
  lines.push(`    .email-footer { padding: 20px 32px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 11px; color: #999; }`);
  lines.push(`    .email-footer a { color: #999; text-decoration: underline; }`);
  lines.push(`  </style>`);
  lines.push(`</head>`);
  lines.push(`<body>`);
  lines.push(`  <div class="email-wrapper">`);

  for (const el of card.elements) {
    switch (el.type) {
      case "image": {
        const src = el.imageData?.src;
        const alt = el.imageData?.alt || el.content;
        const fit = el.imageData?.fit || "cover";
        if (fit === "contain" || el.content === "Williams Sonoma") {
          lines.push(`    <img class="logo" data-eid="${el.id}" src="${esc(src || "")}" alt="${esc(alt)}" />`);
        } else {
          lines.push(`    <img class="hero-image" data-eid="${el.id}" src="${esc(src || "")}" alt="${esc(alt)}" />`);
        }
        break;
      }
      case "headline":
        lines.push(`    <div class="section-padded" data-eid="${el.id}">`);
        lines.push(`      <h1>${esc(el.content)}</h1>`);
        lines.push(`    </div>`);
        break;
      case "body": {
        lines.push(`    <div class="section" data-eid="${el.id}">`);
        const paragraphs = el.content.split(/\n\n|\n/).filter((p) => p.trim());
        for (const p of paragraphs) {
          lines.push(`      <p>${esc(p.trim())}</p>`);
        }
        lines.push(`    </div>`);
        break;
      }
      case "cta":
        lines.push(`    <div class="section-padded" data-eid="${el.id}">`);
        lines.push(`      <a class="cta-button" href="#">${esc(el.content)}</a>`);
        lines.push(`    </div>`);
        break;
      case "divider":
        lines.push(`    <hr class="divider" data-eid="${el.id}" />`);
        break;
    }
  }

  lines.push(`    <div class="email-footer">`);
  lines.push(`      Williams Sonoma &nbsp;|&nbsp; <a href="#">Unsubscribe</a> &nbsp;|&nbsp; <a href="#">Privacy Policy</a>`);
  lines.push(`    </div>`);
  lines.push(`  </div>`);
  lines.push(`</body>`);
  lines.push(`</html>`);

  return lines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
