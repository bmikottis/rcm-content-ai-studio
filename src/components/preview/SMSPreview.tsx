"use client";

import { ContentBlock } from "@/types/canvas";
import { TestContact } from "@/data/mock-contacts";
import { personalizeContent } from "@/lib/personalization";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { cn } from "@/lib/cn";

interface SMSPreviewProps {
  content: ContentBlock;
  contact: TestContact;
  className?: string;
}

export function SMSPreview({ content, contact, className }: SMSPreviewProps) {
  const cards = useSimpleCanvasStore((s) => s.cards);
  const card = cards.find((c) => c.id === content.id);

  // Build SMS body from card elements (body elements joined)
  const rawBody = card
    ? card.elements.filter((e) => e.type === "body").map((e) => e.content).join("\n")
    : content.body;
  const personalizedBody = personalizeContent(rawBody, contact);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
        <button className="text-[#0F8EFF]">←</button>
        <div className="flex-1 text-center">
          <div className="text-body-sm font-medium text-[var(--text-primary)]">
            Williams Sonoma
          </div>
        </div>
        <div className="w-6" />
      </div>

      {/* Messages area */}
      <div className="flex-1 py-4">
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-[#3B82F6] text-white px-4 py-3 rounded-2xl rounded-br-md text-[14px]">
            {personalizedBody}
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[13px] text-[var(--text-muted)]">
            10:42 AM ✓✓
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 px-4 bg-[var(--surface-active)] rounded-full border border-[var(--border)] text-[14px] text-[var(--text-muted)] flex items-center">
            Text Message
          </div>
          <button className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
