"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore } from "@/stores/composer";
import { InlineToken, Attachment } from "@/types/composer";
import { cn } from "@/lib/cn";

interface InlineTokensProps {
  variant: "dark" | "light" | "glass";
}

export function InlineTokens({ variant }: InlineTokensProps) {
  const { tokens, attachments, selectedPalette, removeToken, removeAttachment, setPalette } = useComposerStore();
  
  const isLight = variant === "light" || variant === "glass";
  const hasItems = tokens.length > 0 || attachments.length > 0 || selectedPalette;

  if (!hasItems) return null;

  const t = {
    container: isLight ? "border-[#DDD]" : "border-white/[0.06]",
    token: isLight
      ? variant === "glass" 
        ? "bg-white/60 text-neutral-700 border-[#DDD]/50 backdrop-blur-sm"
        : "bg-neutral-100 text-neutral-700 border-[#DDD]"
      : "bg-white/[0.06] text-white/80 border-white/[0.08]",
    tokenHover: isLight ? "hover:bg-neutral-200" : "hover:bg-white/[0.1]",
    close: isLight ? "hover:bg-neutral-300" : "hover:bg-white/20",
    label: isLight ? "text-[#7A7A7A]" : "text-white/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("px-4 pb-3 border-t", t.container)}
    >
      <div className="pt-3 flex flex-wrap gap-2">
        {/* Tokens */}
        <AnimatePresence mode="popLayout">
          {tokens.map((token) => (
            <TokenChip
              key={token.id}
              token={token}
              onRemove={() => removeToken(token.id)}
              theme={t}
            />
          ))}
        </AnimatePresence>

        {/* Attachments */}
        <AnimatePresence mode="popLayout">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              onRemove={() => removeAttachment(attachment.id)}
              theme={t}
            />
          ))}
        </AnimatePresence>

        {/* Palette */}
        {selectedPalette && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors",
              t.token, t.tokenHover
            )}
          >
            <div className="flex -space-x-0.5">
              {selectedPalette.colors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium">{selectedPalette.name}</span>
            <button
              onClick={() => setPalette(null)}
              className={cn("w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", t.close)}
            >
              <CloseIcon className="w-2.5 h-2.5" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface TokenChipProps {
  token: InlineToken;
  onRemove: () => void;
  theme: Record<string, string>;
}

function TokenChip({ token, onRemove, theme }: TokenChipProps) {
  const icons: Record<InlineToken["type"], React.ReactNode> = {
    brand: <BrandIcon className="w-3 h-3" />,
    audience: <AudienceIcon className="w-3 h-3" />,
    asset: <AssetIcon className="w-3 h-3" />,
    image: <ImageIcon className="w-3 h-3" />,
    file: <FileIcon className="w-3 h-3" />,
    palette: <PaletteIcon className="w-3 h-3" />,
    segment: <SegmentIcon className="w-3 h-3" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors",
        theme.token, theme.tokenHover
      )}
    >
      <span className="opacity-60">{icons[token.type]}</span>
      <span className="text-[13px] font-medium">{token.label}</span>
      <button
        onClick={onRemove}
        className={cn("w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", theme.close)}
      >
        <CloseIcon className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  );
}

interface AttachmentChipProps {
  attachment: Attachment;
  onRemove: () => void;
  theme: Record<string, string>;
}

function AttachmentChip({ attachment, onRemove, theme }: AttachmentChipProps) {
  const icons: Record<Attachment["type"], React.ReactNode> = {
    pdf: <PdfIcon className="w-3 h-3" />,
    image: <ImageIcon className="w-3 h-3" />,
    figma: <FigmaIcon className="w-3 h-3" />,
    doc: <DocIcon className="w-3 h-3" />,
    asset: <AssetIcon className="w-3 h-3" />,
  };

  const sourceLabel = attachment.source === "salesforce" ? "SF" : attachment.source === "upload" ? "" : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors",
        theme.token, theme.tokenHover
      )}
    >
      <span className="opacity-60">{icons[attachment.type]}</span>
      <span className="text-[13px] font-medium max-w-[100px] truncate">{attachment.name}</span>
      {sourceLabel && (
        <span className={cn("text-[11px] px-1 rounded", theme.label)}>{sourceLabel}</span>
      )}
      {attachment.size && (
        <span className={cn("text-[11px]", theme.label)}>{attachment.size}</span>
      )}
      <button
        onClick={onRemove}
        className={cn("w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", theme.close)}
      >
        <CloseIcon className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function AudienceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AssetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1" />
      <circle cx="17.5" cy="10.5" r="1" />
      <circle cx="8.5" cy="7.5" r="1" />
      <circle cx="6.5" cy="12.5" r="1" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function SegmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5.5A5.5 5.5 0 0 1 10.5 0H12v7.5h-1.5A5.5 5.5 0 0 1 5 5.5z" opacity="0.6" />
      <path d="M12 0h1.5a5.5 5.5 0 1 1 0 11H12V0z" opacity="0.4" />
      <path d="M5 12a5.5 5.5 0 0 1 5.5-5.5H12v11h-1.5A5.5 5.5 0 0 1 5 12z" opacity="0.8" />
    </svg>
  );
}
