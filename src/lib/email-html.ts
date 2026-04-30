import type { ContentBlock } from "@/types/canvas";

/**
 * Convert a ContentBlock into a simple editable HTML string.
 * This intentionally produces clean, readable markup so power users
 * can tweak text, spacing, variables, etc.
 */
export function contentBlockToHtml(block: ContentBlock): string {
  const lines: string[] = [];

  lines.push(`<!DOCTYPE html>`);
  lines.push(`<html lang="en">`);
  lines.push(`<head>`);
  lines.push(`  <meta charset="UTF-8" />`);
  lines.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`);
  lines.push(`  <title>${escapeHtml(block.headline)}</title>`);
  lines.push(`  <style>`);
  lines.push(`    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }`);
  lines.push(`    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }`);
  lines.push(`    .email-header { padding: 32px 24px 0; }`);
  lines.push(`    .email-body { padding: 16px 24px 24px; }`);
  lines.push(`    .email-footer { padding: 16px 24px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #999; }`);
  lines.push(`    h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px; }`);
  lines.push(`    p { font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 12px; }`);
  lines.push(`    .hero-image { width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #f5f7fa, #c3cfe2); display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px; }`);
  lines.push(`    .cta-button { display: inline-block; padding: 12px 28px; background: #0F8EFF; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }`);
  lines.push(`  </style>`);
  lines.push(`</head>`);
  lines.push(`<body>`);
  lines.push(`  <div class="email-wrapper">`);

  if (block.image) {
    lines.push(`    <div class="hero-image">${escapeHtml(block.image.placeholder)}</div>`);
  }

  lines.push(`    <div class="email-header">`);
  lines.push(`      <h1>${escapeHtml(block.headline)}</h1>`);
  lines.push(`    </div>`);
  lines.push(`    <div class="email-body">`);

  const paragraphs = block.body.split(/\n\n|\n/).filter((p) => p.trim());
  for (const p of paragraphs) {
    lines.push(`      <p>${escapeHtml(p.trim())}</p>`);
  }

  lines.push(`      <p style="margin-top: 24px;">`);
  lines.push(`        <a class="cta-button" href="${escapeHtml(block.cta.url)}">${escapeHtml(block.cta.text)} &rarr;</a>`);
  lines.push(`      </p>`);
  lines.push(`    </div>`);
  lines.push(`    <div class="email-footer">`);
  lines.push(`      Salesforce Palette &nbsp;|&nbsp; <a href="#">Unsubscribe</a> &nbsp;|&nbsp; <a href="#">Privacy</a>`);
  lines.push(`    </div>`);
  lines.push(`  </div>`);
  lines.push(`</body>`);
  lines.push(`</html>`);

  return lines.join("\n");
}

/**
 * Parse an edited HTML string back into partial ContentBlock fields.
 * Best-effort: pulls headline from <h1>, body from <p> tags in .email-body,
 * CTA text from .cta-button, and image placeholder from .hero-image.
 */
export function htmlToContentBlockFields(
  html: string,
): Pick<ContentBlock, "headline" | "body" | "cta"> & { imagePlaceholder?: string } {
  // headline: first <h1>
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const headline = h1Match ? unescapeHtml(h1Match[1].trim()) : "";

  // body paragraphs: all <p> not containing the CTA
  const bodyParts: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pRegex.exec(html)) !== null) {
    const inner = m[1];
    // skip the CTA paragraph
    if (inner.includes("cta-button")) continue;
    bodyParts.push(unescapeHtml(inner.replace(/<[^>]*>/g, "").trim()));
  }
  const body = bodyParts.filter(Boolean).join("\n\n");

  // CTA
  const ctaMatch = html.match(/<a[^>]*class="cta-button"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  const ctaText = ctaMatch
    ? unescapeHtml(ctaMatch[2].replace(/&rarr;/g, "").replace(/→/g, "").trim())
    : "Learn more";
  const ctaUrl = ctaMatch ? unescapeHtml(ctaMatch[1]) : "#";

  // hero image placeholder
  const heroMatch = html.match(/<div[^>]*class="hero-image"[^>]*>([\s\S]*?)<\/div>/i);
  const imagePlaceholder = heroMatch ? unescapeHtml(heroMatch[1].trim()) : undefined;

  return {
    headline,
    body,
    cta: { text: ctaText, url: ctaUrl },
    ...(imagePlaceholder ? { imagePlaceholder } : {}),
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}
