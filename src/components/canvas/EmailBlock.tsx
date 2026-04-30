"use client";

import { ContentBlock as ContentBlockType } from "@/types/canvas";
import { ContentBlock } from "./ContentBlock";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { PersonalizationToken } from "./PersonalizationToken";
import { cn } from "@/lib/cn";

interface EmailBlockProps {
  block: ContentBlockType;
  className?: string;
}

export function EmailBlock({ block, className }: EmailBlockProps) {
  const renderTextWithTokens = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return <PersonalizationToken key={i} token={part} />;
      }
      return part;
    });
  };

  return (
    <ContentBlock
      id={block.id}
      channel={block.channel}
      variant={block.variant}
      brandCompliance={block.brandCompliance}
      className={className}
    >
      {/* Subject line */}
      <div className="mb-4">
        <span className="text-caption text-[var(--text-muted)]">Subject:</span>
        <h3 className="text-h3 text-[var(--text-primary)] mt-1">
          {renderTextWithTokens(block.headline)}
        </h3>
      </div>

      {/* Hero image */}
      {block.image && (
        <div className="mb-4">
          <ImagePlaceholder
            placeholder={block.image.placeholder}
            aspectRatio={block.image.aspectRatio}
          />
        </div>
      )}

      {/* Body */}
      <div className="text-body text-[var(--text-secondary)] whitespace-pre-line mb-4">
        {renderTextWithTokens(block.body)}
      </div>

      {/* CTA */}
      <div className="inline-block">
        <button className="px-6 py-3 bg-[var(--accent)] text-white rounded-[var(--radius-md)] text-[15px] font-medium hover:bg-[var(--accent-hover)] transition-colors">
          {block.cta.text} →
        </button>
      </div>

      {/* Meta footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
        <span>Personalization: {block.personalization.join(", ")}</span>
        <span>•</span>
        <span>{block.image ? "1 image" : "No images"}</span>
        <span>•</span>
        <span>1 CTA</span>
      </div>
    </ContentBlock>
  );
}
