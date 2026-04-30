export interface VibeTransformation {
  replacements: Array<{ from: string; to: string }>;
  brandComplianceChange: number;
}

export const vibeTransformations: Record<string, VibeTransformation> = {
  "more premium": {
    replacements: [
      { from: "Introducing", to: "Presenting" },
      { from: "designed for", to: "crafted for" },
      { from: "families who refuse to compromise", to: "discerning individuals who demand excellence" },
      { from: "starts today", to: "begins today" },
      { from: "Discover More", to: "Experience Excellence" },
    ],
    brandComplianceChange: 2,
  },
  shorter: {
    replacements: [
      {
        from: "The road to tomorrow starts today. Introducing",
        to: "Introducing",
      },
      {
        from: "With 350 miles of range and room for everything that matters, it's time to move forward. Together.",
        to: "350 miles of range. Room for everything. Move forward.",
      },
    ],
    brandComplianceChange: 0,
  },
  "more urgent": {
    replacements: [
      { from: "Discover More", to: "Reserve Yours Now" },
      { from: "it's time to move forward", to: "don't wait—move forward today" },
      { from: "Book your test drive", to: "Limited slots—book now" },
    ],
    brandComplianceChange: -3,
  },
  warmer: {
    replacements: [
      { from: "Dear {{first_name}}", to: "Hi {{first_name}}!" },
      { from: "designed for families", to: "made with families like yours in mind" },
      { from: "it's time to move forward. Together.", to: "let's move forward—together." },
    ],
    brandComplianceChange: 1,
  },
};

export const quickVibes = [
  { id: "shorter", label: "Shorter" },
  { id: "more urgent", label: "More urgent" },
  { id: "warmer", label: "Warmer" },
  { id: "more premium", label: "More premium" },
  { id: "more casual", label: "More casual" },
  { id: "add cta", label: "Add CTA" },
];

export function applyVibeTransformation(
  text: string,
  vibe: string
): { newText: string; brandComplianceChange: number } {
  const transformation = vibeTransformations[vibe.toLowerCase()];
  
  if (!transformation) {
    return { newText: text, brandComplianceChange: 0 };
  }
  
  let newText = text;
  for (const replacement of transformation.replacements) {
    newText = newText.replace(replacement.from, replacement.to);
  }
  
  return {
    newText,
    brandComplianceChange: transformation.brandComplianceChange,
  };
}
