"use client";

import { ContentBlock } from "@/types/canvas";
import { TestContact } from "@/data/mock-contacts";
import { personalizeContent } from "@/lib/personalization";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { cn } from "@/lib/cn";

interface EmailPreviewProps {
  content: ContentBlock;
  contact: TestContact;
  className?: string;
}

export function EmailPreview({ content, contact, className }: EmailPreviewProps) {
  const cards = useSimpleCanvasStore((s) => s.cards);
  const card = cards.find((c) => c.id === content.id);

  // If we have a matching card, render element-by-element for full fidelity
  if (card) {
    return (
      <div className={cn("text-[14px] font-serif", className)}>
        {/* Email envelope header */}
        <div className="space-y-1 mb-4 pb-4 border-b border-[var(--border)] font-sans">
          <div className="flex">
            <span className="w-16 text-[var(--text-muted)] text-[13px]">From</span>
            <span className="text-[var(--text-primary)] text-[13px]">Williams Sonoma &lt;hello@williams-sonoma.com&gt;</span>
          </div>
          <div className="flex">
            <span className="w-16 text-[var(--text-muted)] text-[13px]">To</span>
            <span className="text-[var(--text-primary)] text-[13px]">{contact.email}</span>
          </div>
          <div className="flex">
            <span className="w-16 text-[var(--text-muted)] text-[13px]">Subject</span>
            <span className="text-[var(--text-primary)] font-medium text-[13px]">
              {personalizeContent(card.subjectLine || card.title, contact)}
            </span>
          </div>
        </div>

        {/* Render each element */}
        {card.elements.map((el) => {
          switch (el.type) {
            case "image": {
              const src = el.imageData?.src;
              const alt = el.imageData?.alt || el.content;
              const fit = el.imageData?.fit || "cover";
              if (fit === "contain" || el.content === "Williams Sonoma") {
                return (
                  <div key={el.id} className="text-center py-4">
                    {src ? (
                      <img src={src} alt={alt} className="h-6 mx-auto object-contain" />
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest">{alt}</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={el.id} className="mb-4 -mx-4">
                  {src ? (
                    <img src={src} alt={alt} className="w-full object-cover" />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                      <span className="text-[var(--text-muted)] text-[13px]">{el.content}</span>
                    </div>
                  )}
                </div>
              );
            }
            case "headline":
              return (
                <h1 key={el.id} className="text-[22px] font-bold text-[var(--text-primary)] mb-3 px-2 leading-tight">
                  {personalizeContent(el.content, contact)}
                </h1>
              );
            case "body":
              return (
                <div key={el.id} className="text-[14px] text-[var(--text-secondary)] whitespace-pre-line mb-3 px-2 leading-relaxed">
                  {personalizeContent(el.content, contact)}
                </div>
              );
            case "cta":
              return (
                <div key={el.id} className="px-2 mb-3">
                  <button className="px-6 py-3 bg-neutral-900 text-white text-[13px] font-semibold tracking-wide">
                    {el.content}
                  </button>
                </div>
              );
            case "divider":
              return <hr key={el.id} className="my-4 border-t border-[var(--border)]" />;
            default:
              return null;
          }
        })}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] text-[13px] text-[var(--text-muted)] text-center font-sans">
          Williams Sonoma &nbsp;|&nbsp; Unsubscribe &nbsp;|&nbsp; Privacy Policy
        </div>
      </div>
    );
  }

  // Fallback: legacy rendering from ContentBlock
  const personalizedHeadline = personalizeContent(content.headline, contact);
  const personalizedBody = personalizeContent(content.body, contact);

  return (
    <div className={cn("text-[14px]", className)}>
      <div className="space-y-1 mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex">
          <span className="w-16 text-[var(--text-muted)]">From</span>
          <span className="text-[var(--text-primary)]">Williams Sonoma &lt;hello@williams-sonoma.com&gt;</span>
        </div>
        <div className="flex">
          <span className="w-16 text-[var(--text-muted)]">To</span>
          <span className="text-[var(--text-primary)]">{contact.email}</span>
        </div>
        <div className="flex">
          <span className="w-16 text-[var(--text-muted)]">Subject</span>
          <span className="text-[var(--text-primary)] font-medium">{personalizedHeadline}</span>
        </div>
      </div>

      {content.image && (
        <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-[var(--text-muted)] text-[13px]">{content.image.placeholder}</span>
        </div>
      )}

      <div className="text-[var(--text-secondary)] whitespace-pre-line mb-4">{personalizedBody}</div>

      <button className="px-5 py-2.5 bg-neutral-900 text-white text-[14px] font-medium">
        {content.cta.text} →
      </button>

      <div className="mt-6 pt-4 border-t border-[var(--border)] text-[13px] text-[var(--text-muted)] text-center">
        Williams Sonoma | Unsubscribe | Privacy
      </div>
    </div>
  );
}
