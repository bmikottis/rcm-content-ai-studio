import type { ContentElement } from "@/types/simple-canvas";

/** At most two blocks per email show claim-count badges; at most two anchor blocks for compliance flags. */
export function regulatedEmailChromeAnchors(elements: ContentElement[]): {
  claimHintIds: Set<string>;
  flagIds: Set<string>;
} {
  const bodies = elements.filter((e) => e.type === "body");
  const firstBody = bodies[0];
  const lastBody = bodies.length > 0 ? bodies[bodies.length - 1] : undefined;
  const firstImage = elements.find((e) => e.type === "image");
  const firstHeadline = elements.find((e) => e.type === "headline");

  const claimHintIds = new Set<string>();
  if (firstBody) claimHintIds.add(firstBody.id);
  else if (firstHeadline) claimHintIds.add(firstHeadline.id);
  if (firstImage) claimHintIds.add(firstImage.id);

  const flagIds = new Set<string>();
  if (firstBody) flagIds.add(firstBody.id);
  if (lastBody) flagIds.add(lastBody.id);
  if (!firstBody && firstHeadline) flagIds.add(firstHeadline.id);

  return { claimHintIds, flagIds };
}
