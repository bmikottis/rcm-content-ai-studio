"use client";

import { useCallback, useMemo } from "react";
import type { AtomicBlock, AtomicBlockType } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { BlockAttachmentsPanel } from "@/components/workspace/BlockChannelAttachments";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

const TYPE_TITLE: Record<AtomicBlockType, string> = {
  image: "Image",
  headline: "Heading",
  body: "Body",
  cta: "Button",
  section: "Section",
  disclaimer: "Disclaimer",
  token: "Token",
  divider: "Divider",
  language: "Language",
};

type HeadingSize = "small" | "medium" | "large";
type TextResize = "wrap" | "nowrap" | "truncate";

function readMeta(block: AtomicBlock) {
  const m = (block.metadata ?? {}) as {
    headingSize?: HeadingSize;
    textResize?: TextResize;
    imageFit?: "cover" | "contain";
    imageAlt?: string;
  };
  return {
    headingSize: (m.headingSize ?? "medium") as HeadingSize,
    textResize: (m.textResize ?? "wrap") as TextResize,
    imageFit: (m.imageFit ?? "cover") as "cover" | "contain",
    imageAlt: typeof m.imageAlt === "string" ? m.imageAlt : "",
  };
}

interface FragmentPropertyEditorProps {
  block: AtomicBlock;
  /** When set (e.g. channel drill-in), back and delete return to channel properties instead of only clearing inspector. */
  onCloseFragment?: () => void;
}

export function FragmentPropertyEditor({ block, onCloseFragment }: FragmentPropertyEditorProps) {
  const { updateAtomicBlock, removeAtomicBlock } = useWorkspaceStore();
  const { closeInspectorDetail } = useToolsStore();
  const meta = useMemo(() => readMeta(block), [block]);

  const finishFragment = onCloseFragment ?? closeInspectorDetail;

  const title = TYPE_TITLE[block.type];

  const patchMeta = useCallback(
    (patch: Record<string, unknown>) => {
      updateAtomicBlock(block.id, {
        metadata: { ...block.metadata, ...patch },
      });
    },
    [block.id, block.metadata, updateAtomicBlock],
  );

  const setContent = (content: string) => {
    updateAtomicBlock(block.id, { content });
  };

  const handleDelete = () => {
    removeAtomicBlock(block.id);
    finishFragment();
  };

  const isTextual = [
    "headline",
    "body",
    "cta",
    "disclaimer",
    "token",
    "language",
    "section",
    "divider",
  ].includes(block.type);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarDrilldownHeader title={title} onBack={finishFragment} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
        <BlockAttachmentsPanel block={block} variant="card" />

        {block.type === "image" && (
          <ImageFragmentFields
            block={block}
            meta={meta}
            onContent={setContent}
            onPatchMeta={patchMeta}
          />
        )}

        {isTextual && block.type !== "image" && (
          <TextFragmentFields
            block={block}
            title={title}
            meta={meta}
            onContent={setContent}
            onPatchMeta={patchMeta}
            showHeadingControls={block.type === "headline" || block.type === "body"}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
        <button
          type="button"
          onClick={handleDelete}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
          Delete element
        </button>
      </div>
    </div>
  );
}

function TextFragmentFields({
  block,
  title,
  meta,
  onContent,
  onPatchMeta,
  showHeadingControls,
}: {
  block: AtomicBlock;
  title: string;
  meta: ReturnType<typeof readMeta>;
  onContent: (v: string) => void;
  onPatchMeta: (p: Record<string, unknown>) => void;
  showHeadingControls: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">{title}</label>
        <RichTextToolbar />
        <textarea
          value={block.content}
          onChange={(e) => onContent(e.target.value)}
          rows={5}
          className={cn(
            "mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10",
            meta.headingSize === "small" && "text-[13px]",
            meta.headingSize === "medium" && "text-[15px]",
            meta.headingSize === "large" && "text-[18px] leading-snug",
            meta.textResize === "nowrap" && "whitespace-nowrap",
            meta.textResize === "truncate" && "overflow-hidden text-ellipsis",
          )}
        />
      </div>

      {showHeadingControls && (
        <>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Heading size</label>
            <select
              value={meta.headingSize}
              onChange={(e) => onPatchMeta({ headingSize: e.target.value as HeadingSize })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Text resize</label>
            <select
              value={meta.textResize}
              onChange={(e) => onPatchMeta({ textResize: e.target.value as TextResize })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
            >
              <option value="wrap">Wrap</option>
              <option value="nowrap">No wrap</option>
              <option value="truncate">Truncate</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}

function ImageFragmentFields({
  block,
  meta,
  onContent,
  onPatchMeta,
}: {
  block: AtomicBlock;
  meta: ReturnType<typeof readMeta>;
  onContent: (v: string) => void;
  onPatchMeta: (p: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Label</label>
        <input
          type="text"
          value={block.content}
          onChange={(e) => onContent(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Alt text</label>
        <input
          type="text"
          value={meta.imageAlt}
          onChange={(e) => onPatchMeta({ imageAlt: e.target.value })}
          placeholder="Describe the image"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Fit</label>
        <select
          value={meta.imageFit}
          onChange={(e) => onPatchMeta({ imageFit: e.target.value })}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>
      </div>
      <div
        className={cn(
          "flex h-[132px] w-full shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-3",
        )}
      >
        <p className="max-w-[280px] text-center text-[13px] leading-snug text-[var(--text-secondary)] text-balance">
          Image asset preview is linked from your library. Use{" "}
          <span className="font-medium text-[var(--text-secondary)]">Replace</span> in quick actions to change the
          file.
        </p>
      </div>
    </div>
  );
}

function RichTextToolbar() {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]";
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border)] bg-neutral-100/80 p-1">
      <button type="button" className={btn} aria-label="Bold" title="Bold">
        <span className="text-[13px] font-bold">B</span>
      </button>
      <button type="button" className={btn} aria-label="Italic" title="Italic">
        <span className="text-[13px] italic">I</span>
      </button>
      <button type="button" className={btn} aria-label="Underline" title="Underline">
        <span className="text-[13px] underline">U</span>
      </button>
      <button type="button" className={btn} aria-label="Strikethrough" title="Strikethrough">
        <span className="text-[13px] line-through">S</span>
      </button>
      <span className="mx-1 h-5 w-px bg-neutral-200" />
      <button type="button" className={btn} aria-label="Bullet list">
        <ListIcon />
      </button>
      <button type="button" className={btn} aria-label="Numbered list">
        <ListOrderedIcon />
      </button>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function ListOrderedIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1-2-1" />
    </svg>
  );
}
