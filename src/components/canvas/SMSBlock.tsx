"use client";

import { ContentBlock as ContentBlockType } from "@/types/canvas";
import { ContentBlock } from "./ContentBlock";
import { PersonalizationToken } from "./PersonalizationToken";
import { CharacterCount } from "./CharacterCount";
import { cn } from "@/lib/cn";

interface SMSBlockProps {
  block: ContentBlockType;
  className?: string;
}

export function SMSBlock({ block, className }: SMSBlockProps) {
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
      {/* Message bubble */}
      <div className="bg-[var(--background)] rounded-[var(--radius-lg)] p-4 max-w-md">
        <p className="text-body text-[var(--text-primary)]">
          {renderTextWithTokens(block.body)}
        </p>
      </div>

      {/* Character count */}
      <div className="mt-3">
        <CharacterCount current={block.characterCount || 0} max={160} />
      </div>

      {/* Meta footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
        <span>Personalization: {block.personalization.join(", ")}</span>
        <span>•</span>
        <span>Link included</span>
      </div>
    </ContentBlock>
  );
}
