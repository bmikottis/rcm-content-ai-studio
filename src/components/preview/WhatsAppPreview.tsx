"use client";

import { ContentBlock } from "@/types/canvas";
import { TestContact } from "@/data/mock-contacts";
import { personalizeContent } from "@/lib/personalization";
import { cn } from "@/lib/cn";

interface WhatsAppPreviewProps {
  content: ContentBlock;
  contact: TestContact;
  className?: string;
}

export function WhatsAppPreview({
  content,
  contact,
  className,
}: WhatsAppPreviewProps) {
  const personalizedHeadline = personalizeContent(content.headline, contact);
  const personalizedBody = personalizeContent(content.body, contact);

  return (
    <div className={cn("flex flex-col h-full bg-[#ECE5DD]", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54] text-white">
        <button>←</button>
        <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-sm">
          AA
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-medium">Salesforce Palette</div>
          <div className="text-[13px] opacity-70">online</div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Image */}
        {content.image && (
          <div className="max-w-[250px] mb-2">
            <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center text-[13px] text-[var(--text-muted)]">
              {content.image.placeholder}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="max-w-[250px] bg-[var(--surface)] rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
          <div className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
            {personalizedHeadline}
          </div>
          <div className="text-[14px] text-[var(--text-secondary)] whitespace-pre-line">
            {personalizedBody}
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-[13px] text-[var(--text-muted)]">
              10:42 AM
              <span className="ml-1 text-[#53BDEB]">✓✓</span>
            </span>
          </div>
        </div>

        {/* Quick reply */}
        <div className="mt-3 max-w-[250px]">
          <button className="w-full py-3 bg-white border border-[#25D366] text-[#25D366] rounded-full text-[14px] font-medium">
            {content.cta.text}
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="px-2 py-2 bg-[#F0F0F0]">
        <div className="flex items-center gap-2">
          <button className="text-[#54656F]">😊</button>
          <button className="text-[#54656F]">📎</button>
          <div className="flex-1 h-10 px-4 bg-[var(--surface)] rounded-full text-[14px] text-[var(--text-muted)] flex items-center">
            Type a message
          </div>
          <button className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white">
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}
