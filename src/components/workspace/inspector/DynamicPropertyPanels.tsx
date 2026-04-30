"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { AtomicBlock, AtomicBlockType, ContentGroup, ChannelVariant, ChannelType } from "@/types/workspace";
import { BlockAttachmentsPanel } from "@/components/workspace/BlockChannelAttachments";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

// ─── CTA / Button Properties ─────────────────────────────────────────────────

export function CtaPropertyPanel({ block }: { block: AtomicBlock }) {
  const { updateAtomicBlock } = useWorkspaceStore();
  const [label, setLabel] = useState(block.content);
  const [linkUrl, setLinkUrl] = useState(
    (block.metadata?.linkUrl as string) ?? "https://example.com",
  );
  const [color, setColor] = useState("#3B82F6");
  const [width, setWidth] = useState("auto");

  const handleLabelBlur = () => {
    updateAtomicBlock(block.id, { content: label });
  };
  const handleLinkBlur = () => {
    updateAtomicBlock(block.id, { metadata: { ...block.metadata, linkUrl } });
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Button">
        <div className="space-y-3">
          <Field label="LABEL">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => e.key === "Enter" && handleLabelBlur()}
              className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--text-primary)]/10"
            />
          </Field>
          <Field label="LINK URL">
            <div className="flex items-center gap-1.5">
              <LinkChainIcon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onBlur={handleLinkBlur}
                onKeyDown={(e) => e.key === "Enter" && handleLinkBlur()}
                placeholder="https://..."
                className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-secondary)] font-mono focus:outline-none focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--text-primary)]/10"
              />
            </div>
          </Field>
          <Field label="COLOR">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-secondary)] font-mono focus:outline-none focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--text-primary)]/10"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#1D1D1D"].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c ? "border-neutral-900 scale-110" : "border-white shadow-sm hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
          <Field label="WIDTH">
            <div className="flex gap-1">
              {["auto", "full", "fixed"].map(w => (
                <button
                  key={w}
                  onClick={() => setWidth(w)}
                  className={cn(
                    "flex-1 h-8 rounded-lg border text-[13px] font-medium capitalize transition-colors",
                    width === w
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>
          <Field label="BORDER RADIUS">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="24"
                defaultValue="8"
                className="flex-1 accent-neutral-900"
              />
              <span className="text-[13px] text-[var(--text-secondary)] w-8 text-right tabular-nums">8px</span>
            </div>
          </Field>
        </div>
      </Section>
      <Section title="Linked channels">
        <BlockAttachmentsPanel block={block} variant="inline" />
      </Section>
    </div>
  );
}

// ─── Section Properties (Container for CTA/Buttons) ──────────────────────────

export function SectionPropertyPanel({ block }: { block: AtomicBlock }) {
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [padding, setPadding] = useState("16");
  const [backgroundColor, setBackgroundColor] = useState("transparent");

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Section">
        <div className="space-y-3">
          <Field label="ALIGNMENT">
            <div className="flex gap-1">
              {[
                { value: "left", icon: "align-left" },
                { value: "center", icon: "align-center" },
                { value: "right", icon: "align-right" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAlignment(opt.value as "left" | "center" | "right")}
                  className={cn(
                    "flex-1 h-8 rounded-lg border flex items-center justify-center transition-colors",
                    alignment === opt.value
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]"
                  )}
                >
                  {opt.value === "left" && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="15" y2="12" />
                      <line x1="3" y1="18" x2="18" y2="18" />
                    </svg>
                  )}
                  {opt.value === "center" && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="6" y1="12" x2="18" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                    </svg>
                  )}
                  {opt.value === "right" && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="9" y1="12" x2="21" y2="12" />
                      <line x1="6" y1="18" x2="21" y2="18" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Field>
          <Field label="PADDING">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="48"
                value={padding}
                onChange={(e) => setPadding(e.target.value)}
                className="flex-1 accent-neutral-900"
              />
              <span className="text-[13px] text-[var(--text-secondary)] w-10 text-right tabular-nums">{padding}px</span>
            </div>
          </Field>
          <Field label="BACKGROUND">
            <div className="flex gap-1.5">
              {["transparent", "#F5F5F5", "#E5E7EB", "#FEF3C7", "#DBEAFE", "#FCE7F3"].map((c) => (
                <button
                  key={c}
                  onClick={() => setBackgroundColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center",
                    backgroundColor === c ? "border-neutral-900 scale-110" : "border-[var(--border)] hover:scale-105"
                  )}
                  style={{ backgroundColor: c === "transparent" ? "#fff" : c }}
                >
                  {c === "transparent" && (
                    <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="4" x2="20" y2="20" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>
      <Section title="Elements">
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-white text-[13px] font-medium">
              BTN
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{block.content}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Button</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-medium hover:border-neutral-400 hover:text-[var(--text-secondary)] transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add element
          </button>
        </div>
      </Section>
      <Section title="Linked channels">
        <BlockAttachmentsPanel block={block} variant="inline" />
      </Section>
    </div>
  );
}

// ─── Text (Headline / Body) Properties ───────────────────────────────────────

export function TextPropertyPanel({ block }: { block: AtomicBlock }) {
  const { updateAtomicBlock } = useWorkspaceStore();
  const [content, setContent] = useState(block.content);
  const [fontSize, setFontSize] = useState(block.type === "headline" ? "24" : "16");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [fontWeight, setFontWeight] = useState(block.type === "headline" ? "bold" : "normal");

  const handleContentBlur = () => {
    updateAtomicBlock(block.id, { content });
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title={block.type === "headline" ? "Heading" : "Body Text"}>
        <div className="space-y-3">
          {/* Mini toolbar */}
          <div className="flex items-center gap-0.5 p-1 bg-[var(--surface-subtle)] rounded-lg border border-[var(--border)]">
            <FormatButton icon="B" active={fontWeight === "bold"} onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")} />
            <FormatButton icon="I" italic onClick={() => {}} />
            <FormatButton icon="U" underline onClick={() => {}} />
            <FormatButton icon="S" strikethrough onClick={() => {}} />
            <div className="w-px h-5 bg-neutral-200 mx-0.5" />
            <FormatButton icon="≡" active={alignment === "left"} onClick={() => setAlignment("left")} />
            <FormatButton icon="≡" active={alignment === "center"} onClick={() => setAlignment("center")} />
            <FormatButton icon="≡" active={alignment === "right"} onClick={() => setAlignment("right")} />
          </div>

          {/* Content editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            rows={block.type === "headline" ? 2 : 5}
            className={cn(
              "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--border)]",
              block.type === "headline" ? "text-[16px] font-semibold" : "text-[13px] leading-relaxed"
            )}
          />
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <Field label="FONT SIZE">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-20 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border)]"
              />
              <span className="text-[13px] text-[var(--text-muted)]">px</span>
              <div className="flex-1" />
              <select
                defaultValue="Inter"
                className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--text-secondary)] focus:outline-none"
              >
                <option>Inter</option>
                <option>SF Pro</option>
                <option>System</option>
              </select>
            </div>
          </Field>
          <Field label="LINE HEIGHT">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                defaultValue="1.5"
                className="flex-1 accent-neutral-900"
              />
              <span className="text-[13px] text-[var(--text-secondary)] w-8 text-right tabular-nums">1.5</span>
            </div>
          </Field>
          <Field label="LETTER SPACING">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-0.05"
                max="0.2"
                step="0.01"
                defaultValue="0"
                className="flex-1 accent-neutral-900"
              />
              <span className="text-[13px] text-[var(--text-secondary)] w-8 text-right tabular-nums">0</span>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Linked channels">
        <BlockAttachmentsPanel block={block} variant="inline" />
      </Section>
    </div>
  );
}

// ─── Image Properties ────────────────────────────────────────────────────────

export function ImagePropertyPanel({ block }: { block: AtomicBlock }) {
  const { startImageEdit } = useToolsStore();
  const [crop, setCrop] = useState("fill");

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Image">
        <div className="space-y-3">
          {/* Preview */}
          <div className="aspect-video rounded-lg bg-[var(--surface-active)] border border-[#DDD]/60 flex items-center justify-center overflow-hidden">
            <span className="text-[13px] text-[var(--text-muted)] font-medium">{block.content}</span>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)] transition-colors">
              Replace
            </button>
            <button
              onClick={() => startImageEdit(block.id, "crop")}
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)] transition-colors"
            >
              Crop
            </button>
          </div>

          {/* AI tools */}
          <div className="space-y-1.5">
            <p className="text-[13px] font-normal uppercase text-[var(--text-secondary)] tracking-wide">AI TOOLS</p>
            <button
              onClick={() => startImageEdit(block.id, "regenerate")}
              className="w-full h-9 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-[13px] font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Edit with AI
            </button>
            <button className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)] transition-colors">
              Remove background
            </button>
            <button className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)] transition-colors">
              Enhance quality
            </button>
          </div>
        </div>
      </Section>

      <Section title="Layout">
        <div className="space-y-3">
          <Field label="FIT">
            <div className="flex gap-1">
              {["fill", "fit", "stretch"].map(f => (
                <button
                  key={f}
                  onClick={() => setCrop(f)}
                  className={cn(
                    "flex-1 h-8 rounded-lg border text-[13px] font-medium capitalize transition-colors",
                    crop === f
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </Field>
          <Field label="DIMENSIONS">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <span className="text-[11px] text-[var(--text-muted)] uppercase">W</span>
                <input
                  type="number"
                  defaultValue={block.size?.width ?? 200}
                  className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border)]"
                />
              </div>
              <span className="text-neutral-300 mt-3">×</span>
              <div className="flex-1">
                <span className="text-[11px] text-[var(--text-muted)] uppercase">H</span>
                <input
                  type="number"
                  defaultValue={block.size?.height ?? 120}
                  className="w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border)]"
                />
              </div>
            </div>
          </Field>
          <Field label="BORDER RADIUS">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="24"
                defaultValue="0"
                className="flex-1 accent-neutral-900"
              />
              <span className="text-[13px] text-[var(--text-secondary)] w-8 text-right tabular-nums">0px</span>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Linked channels">
        <BlockAttachmentsPanel block={block} variant="inline" />
      </Section>
    </div>
  );
}

// ─── Campaign Group Properties ───────────────────────────────────────────────

export function GroupPropertyPanel({ group }: { group: ContentGroup }) {
  const { atomicBlocks, select } = useWorkspaceStore();
  const { openInspectorBlockDetail } = useToolsStore();

  const allFragmentIds = new Set(group.channels.flatMap(ch => ch.atomicBlocks));
  const fragments = atomicBlocks.filter(b => allFragmentIds.has(b.id));

  const fragmentsByType = {
    images: fragments.filter(f => f.type === "image"),
    headlines: fragments.filter(f => f.type === "headline"),
    body: fragments.filter(f => f.type === "body"),
    ctas: fragments.filter(f => f.type === "cta"),
    other: fragments.filter(f => !["image", "headline", "body", "cta"].includes(f.type)),
  };

  const handleFragmentClick = (id: string) => {
    select([id]);
    openInspectorBlockDetail(id);
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Campaign">
        <div className="space-y-3">
          <Field label="NAME">
            <div className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 flex items-center text-[13px] text-[var(--text-primary)]">
              {group.name}
            </div>
          </Field>
          <Field label="CHANNELS">
            <div className="flex flex-wrap gap-1.5">
              {group.channels.map(ch => (
                <span
                  key={ch.id}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[13px] font-medium capitalize",
                    ch.status === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-[var(--surface-active)] text-[var(--text-secondary)]"
                  )}
                >
                  {ch.channel}
                </span>
              ))}
            </div>
          </Field>
          <Field label="STATUS">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                group.channels.every(ch => ch.status === "ready") ? "bg-emerald-400" : "bg-amber-400"
              )} />
              <span className="text-[13px] text-[var(--text-secondary)]">
                {group.channels.filter(ch => ch.status === "ready").length}/{group.channels.length} channels ready
              </span>
            </div>
          </Field>
        </div>
      </Section>

      {/* Nested fragments, grouped by type */}
      {fragmentsByType.images.length > 0 && (
        <Section title="Images">
          <FragmentList fragments={fragmentsByType.images} onClick={handleFragmentClick} />
        </Section>
      )}
      {fragmentsByType.headlines.length > 0 && (
        <Section title="Headlines">
          <FragmentList fragments={fragmentsByType.headlines} onClick={handleFragmentClick} />
        </Section>
      )}
      {fragmentsByType.body.length > 0 && (
        <Section title="Body Text">
          <FragmentList fragments={fragmentsByType.body} onClick={handleFragmentClick} />
        </Section>
      )}
      {fragmentsByType.ctas.length > 0 && (
        <Section title="Buttons">
          <FragmentList fragments={fragmentsByType.ctas} onClick={handleFragmentClick} />
        </Section>
      )}
      {fragmentsByType.other.length > 0 && (
        <Section title="Other">
          <FragmentList fragments={fragmentsByType.other} onClick={handleFragmentClick} />
        </Section>
      )}
    </div>
  );
}

// ─── Channel Properties (Drill-In) ──────────────────────────────────────────

const channelMeta: Record<ChannelType, { label: string; color: string; bg: string }> = {
  email: { label: "Email", color: "text-blue-600", bg: "bg-blue-50" },
  sms: { label: "SMS", color: "text-emerald-600", bg: "bg-emerald-50" },
  whatsapp: { label: "WhatsApp", color: "text-green-600", bg: "bg-green-50" },
  rcs: { label: "RCS", color: "text-purple-600", bg: "bg-purple-50" },
  web: { label: "Web", color: "text-orange-600", bg: "bg-orange-50" },
};

const addableElements: { type: AtomicBlockType; label: string; icon: React.ReactNode; defaultContent: string }[] = [
  {
    type: "section",
    label: "Section",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>,
    defaultContent: "Section",
  },
  {
    type: "image",
    label: "Image",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    defaultContent: "New Image",
  },
  {
    type: "headline",
    label: "Heading",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h8" /></svg>,
    defaultContent: "New heading",
  },
  {
    type: "body",
    label: "Body text",
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
    defaultContent: "Add your body text here...",
  },
];

export function ChannelPropertyPanel({
  channel,
  groupName,
}: {
  channel: ChannelVariant;
  groupName: string;
}) {
  const { atomicBlocks, select, drillInChannel, exitChannel, addAtomicBlockToChannel, reorderChannelBlocks } =
    useWorkspaceStore();
  const { openInspectorBlockDetail } = useToolsStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const meta = channelMeta[channel.channel];
  const blockMap = new Map(atomicBlocks.map((b) => [b.id, b]));
  const orderedFragments = channel.atomicBlocks.map((id) => blockMap.get(id)).filter(Boolean) as AtomicBlock[];

  const typeIcons: Record<string, React.ReactNode> = {
    section: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>,
    image: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    headline: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h8" /></svg>,
    body: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
    cta: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>,
    disclaimer: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    token: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" /><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" /></svg>,
    language: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  };

  const statusColors: Record<string, string> = {
    draft: "bg-neutral-200 text-[var(--text-secondary)]",
    ready: "bg-emerald-100 text-emerald-700",
    approved: "bg-blue-100 text-blue-700",
  };

  const handleFragmentClick = (id: string) => {
    if (dragIndex !== null) return;
    select([id]);
    openInspectorBlockDetail(id);
  };

  const handleAddElement = (type: AtomicBlockType, defaultContent: string) => {
    if (!drillInChannel) return;
    const newId = addAtomicBlockToChannel(
      drillInChannel.groupId,
      drillInChannel.channelId,
      type,
      defaultContent,
    );
    setShowAddMenu(false);
    openInspectorBlockDetail(newId);
  };

  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget;
      e.currentTarget.style.opacity = "0.4";
    }
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    if (drillInChannel && dragIndex !== null && dropTarget !== null && dragIndex !== dropTarget) {
      reorderChannelBlocks(drillInChannel.groupId, drillInChannel.channelId, dragIndex, dropTarget);
    }
    setDragIndex(null);
    setDropTarget(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dropTarget) {
      setDropTarget(index);
    }
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      <SidebarDrilldownHeader
        title={`${groupName} · ${meta.label}`}
        onBack={() => exitChannel()}
        backAriaLabel="Back to canvas"
      />
      {/* Channel header */}
      <Section title="Channel">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", meta.bg)}>
            <ChannelIcon channel={channel.channel} className={cn("w-4 h-4", meta.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{meta.label}</p>
            <p className="text-[13px] text-[var(--text-muted)]">{orderedFragments.length} elements</p>
          </div>
          <span className={cn("px-2 py-0.5 rounded-full text-[13px] font-medium capitalize", statusColors[channel.status])}>
            {channel.status}
          </span>
        </div>
      </Section>

      {/* Ordered element tree */}
      <div className="border-b border-[var(--border)] px-3 py-3">
        <p className="text-[13px] font-medium text-[var(--text-primary)] mb-2">Elements</p>
        <div className="space-y-0.5">
          {orderedFragments.map((f, index) => (
            <div
              key={f.id}
              draggable
              onDragStart={handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(index)}
              className="relative group"
            >
              {dragIndex !== null && dropTarget === index && dragIndex !== index && (
                <div className="absolute -top-0.5 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-10" />
              )}
              <div
                onClick={() => handleFragmentClick(f.id)}
                className="flex items-center gap-1 px-1 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
              >
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <DragHandleIcon className="w-3.5 h-3.5 text-neutral-300" />
                </div>
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors bg-[var(--surface-active)] text-[var(--text-secondary)] group-hover:bg-neutral-200">
                  {typeIcons[f.type] || <span className="text-[13px]">·</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{f.content}</p>
                  <p className="text-[13px] text-[var(--text-muted)] capitalize">{f.type}</p>
                </div>
                <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[var(--text-secondary)] transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add element */}
      <div className="px-3 py-3 relative" ref={addMenuRef}>
        <button
          onClick={() => setShowAddMenu((v) => !v)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 border-dashed text-[13px] font-medium transition-all",
            showAddMenu
              ? "bg-neutral-900 border-neutral-900 text-white"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--text-secondary)]",
          )}
        >
          <AddIcon className="w-3.5 h-3.5" />
          Add element
        </button>

        <AnimatePresence>
          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-3 right-3 bottom-full mb-1 bg-[var(--surface)] rounded-xl shadow-lg border border-[#DDD]/80 overflow-hidden"
              style={{ zIndex: 20 }}
            >
              <div className="py-1">
                {addableElements.map((el) => (
                  <button
                    key={el.type}
                    onClick={() => handleAddElement(el.type, el.defaultContent)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--surface-active)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
                      {el.icon}
                    </div>
                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">{el.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChannelIcon({ channel, className }: { channel: ChannelType; className?: string }) {
  switch (channel) {
    case "email":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "sms":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "rcs":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "web":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--border)] px-3 py-3">
      <p className="text-[13px] font-medium text-[var(--text-primary)] mb-3">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-normal uppercase text-[var(--text-secondary)] tracking-wide">{label}</p>
      {children}
    </div>
  );
}

function FormatButton({
  icon,
  active,
  italic,
  underline,
  strikethrough,
  onClick,
}: {
  icon: string;
  active?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center text-[13px] transition-colors",
        active
          ? "bg-blue-50 text-blue-600 font-bold"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]",
        italic && "italic",
        underline && "underline",
        strikethrough && "line-through",
      )}
    >
      {icon}
    </button>
  );
}

function FragmentList({
  fragments,
  onClick,
}: {
  fragments: AtomicBlock[];
  onClick: (id: string) => void;
}) {
  const typeIcons: Record<string, React.ReactNode> = {
    section: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>,
    image: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    headline: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h8" /></svg>,
    body: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
    cta: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>,
    disclaimer: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    token: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" /><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" /></svg>,
    language: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  };

  return (
    <div className="space-y-1">
      {fragments.map(f => (
        <button
          key={f.id}
          onClick={() => onClick(f.id)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-left group"
        >
          <div className="w-6 h-6 rounded bg-[var(--surface-active)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0 group-hover:bg-neutral-200 transition-colors">
            {typeIcons[f.type] || <span className="text-[13px]">·</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{f.content}</p>
            <p className="text-[13px] text-[var(--text-muted)] capitalize">{f.type}{f.linkedTo?.length ? ` · ${f.linkedTo.length} linked` : ""}</p>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[var(--text-secondary)] transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
