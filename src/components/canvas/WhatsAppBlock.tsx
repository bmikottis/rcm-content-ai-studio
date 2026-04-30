"use client";

import { ContentBlock as ContentBlockType } from "@/types/canvas";
import { ContentBlock } from "./ContentBlock";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { PersonalizationToken } from "./PersonalizationToken";
import { CharacterCount } from "./CharacterCount";
import { cn } from "@/lib/cn";

interface WhatsAppBlockProps {
  block: ContentBlockType;
  className?: string;
}

export function WhatsAppBlock({ block, className }: WhatsAppBlockProps) {
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
      brandCompliance={block.brandCompliance}
      className={className}
    >
      {/* Image */}
      {block.image && (
        <div className="mb-4 max-w-[280px]">
          <ImagePlaceholder
            placeholder={block.image.placeholder}
            aspectRatio={block.image.aspectRatio}
          />
        </div>
      )}

      {/* Headline */}
      <h3 className="text-h3 text-[var(--text-primary)] mb-3">
        {renderTextWithTokens(block.headline)}
      </h3>

      {/* Body */}
      <div className="text-body text-[var(--text-secondary)] whitespace-pre-line mb-4">
        {renderTextWithTokens(block.body)}
      </div>

      {/* CTA */}
      <div className="inline-block">
        <button className="px-6 py-3 bg-[#25D366] text-white rounded-full text-[15px] font-medium hover:bg-[#20bd5a] transition-colors">
          {block.cta.text}
        </button>
      </div>

      {/* Character count */}
      {block.characterCount && (
        <div className="mt-3">
          <CharacterCount current={block.characterCount} max={1024} />
        </div>
      )}

      {/* Meta footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
        <span>Personalization: {block.personalization.join(", ")}</span>
        <span>•</span>
        <span>{block.image ? "1 image" : "No images"}</span>
        <span>•</span>
        <span>Quick reply</span>
      </div>
    </ContentBlock>
  );
}
