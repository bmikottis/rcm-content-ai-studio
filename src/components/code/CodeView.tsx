"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace";
import { usePreviewStore } from "@/stores/preview";
import { buildPreviewTouchpoints } from "@/lib/preview-from-workspace";
import { contentBlockToHtml, htmlToContentBlockFields } from "@/lib/email-html";
import { personalizeContent } from "@/lib/personalization";
import { mockTestContacts } from "@/data/mock-contacts";
import { cn } from "@/lib/cn";
import type { PreviewTouchpoint } from "@/lib/preview-from-workspace";

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

interface CodeViewProps {
  selectedChannelId?: string | null;
}

export function CodeView({ selectedChannelId: externalKey }: CodeViewProps = {}) {
  const { groups, atomicBlocks, updateAtomicBlock } = useWorkspaceStore();
  const { selectedContactId } = usePreviewStore();

  const touchpoints = useMemo(
    () => buildPreviewTouchpoints(groups, atomicBlocks),
    [groups, atomicBlocks],
  );

  // Show email + SMS touchpoints
  const editableTouchpoints = useMemo(
    () => touchpoints.filter((t) => t.channel.channel === "email" || t.channel.channel === "sms"),
    [touchpoints],
  );

  const [internalKey, setInternalKey] = useState<string | null>(null);
  const selectedKey = externalKey ?? internalKey;

  // Auto-select first touchpoint
  useEffect(() => {
    if (!selectedKey && editableTouchpoints.length > 0) {
      setInternalKey(editableTouchpoints[0].key);
    }
  }, [editableTouchpoints, selectedKey]);

  const selected = useMemo(
    () => editableTouchpoints.find((t) => t.key === selectedKey) ?? null,
    [editableTouchpoints, selectedKey],
  );

  const contact = mockTestContacts.find((c) => c.id === selectedContactId) ?? mockTestContacts[0];

  if (editableTouchpoints.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background)]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-8 py-14 text-center shadow-sm">
          <CodeBrackets className="mx-auto mb-4 h-10 w-10 text-[#DDDBDA]" />
          <p className="text-[13px] font-bold text-[var(--text-primary)]">
            No email or SMS channels on the canvas yet.
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Add a channel in Canvas view to edit content here.
          </p>
        </div>
      </div>
    );
  }

  const [activeSection, setActiveSection] = useState<CodeSection>(null);

  return (
    <div className="relative h-full bg-[var(--background)] overflow-hidden">
      {/* Center: Live preview — offset to account for left (288px) and right (388px) panels */}
      <div className="absolute inset-0 overflow-auto" style={{ left: 288, right: selected ? 388 : 0 }}>
        <div className="flex items-start justify-center min-h-full py-6 px-4">
          {selected ? (
            selected.channel.channel === "sms" ? (
              <SMSPhonePreview touchpoint={selected} contact={contact} atomicBlocks={atomicBlocks} updateAtomicBlock={updateAtomicBlock} />
            ) : (
              <EmailPane touchpoint={selected} contact={contact} atomicBlocks={atomicBlocks} updateAtomicBlock={updateAtomicBlock} activeSection={activeSection} onSectionClick={setActiveSection} />
            )
          ) : (
            <p className="text-[13px] text-[var(--text-muted)] mt-20">Select a channel to edit</p>
          )}
        </div>
      </div>

      {/* Floating right panel */}
      {selected && selected.channel.channel === "email" && (
        <CodeSourcePanel touchpoint={selected} contact={contact} atomicBlocks={atomicBlocks} updateAtomicBlock={updateAtomicBlock} activeSection={activeSection} onSectionClick={setActiveSection} />
      )}
      {selected && selected.channel.channel === "sms" && (
        <SMSEditorPanel touchpoint={selected} contact={contact} atomicBlocks={atomicBlocks} updateAtomicBlock={updateAtomicBlock} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

type CodeSection = "image" | "headline" | "body" | "cta" | "footer" | null;

interface PaneProps {
  touchpoint: PreviewTouchpoint;
  contact: (typeof mockTestContacts)[number];
  atomicBlocks: ReturnType<typeof useWorkspaceStore.getState>["atomicBlocks"];
  updateAtomicBlock: ReturnType<typeof useWorkspaceStore.getState>["updateAtomicBlock"];
  activeSection?: CodeSection;
  onSectionClick?: (section: CodeSection) => void;
}

/* ------------------------------------------------------------------ */
/*  Email Pane (HTML split editor)                                     */
/* ------------------------------------------------------------------ */

function EmailPane({ touchpoint, contact, activeSection, onSectionClick }: PaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onSectionClickRef = useRef(onSectionClick);
  onSectionClickRef.current = onSectionClick;
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  const previewHtml = useMemo(() => {
    const generated = contentBlockToHtml(touchpoint.content);
    return personalizeContent(generated, contact);
  }, [touchpoint.content, contact]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();

    // Inject click handlers for interactive section highlighting
    const addClickStyle = () => {
      const style = doc.createElement("style");
      style.textContent = `
        .email-header, .email-header *, .hero-image,
        .email-body p, .email-body, .cta-button,
        .email-footer, .email-footer * { cursor: pointer; }
        .email-header:hover h1 { outline: 2px solid #0F8EFF; outline-offset: 2px; border-radius: 4px; }
        .hero-image:hover { outline: 2px solid #0F8EFF; outline-offset: 2px; }
        .email-body p:hover { outline: 2px solid #0F8EFF; outline-offset: 2px; border-radius: 4px; }
        .cta-button:hover { outline: 2px solid #0F8EFF; outline-offset: 2px; }
        .email-footer:hover { outline: 2px solid #0F8EFF; outline-offset: 2px; border-radius: 4px; }
      `;
      doc.head.appendChild(style);
    };
    addClickStyle();

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      let section: CodeSection = null;
      if (target.closest(".hero-image")) section = "image";
      else if (target.closest(".email-header")) section = "headline";
      else if (target.closest(".cta-button") || target.classList.contains("cta-button")) section = "cta";
      else if (target.closest(".email-footer")) section = "footer";
      else if (target.closest(".email-body")) section = "body";
      if (section) {
        e.preventDefault();
        e.stopPropagation();
        onSectionClickRef.current?.(activeSectionRef.current === section ? null : section);
      }
    };
    doc.addEventListener("click", handleClick);
    return () => { doc.removeEventListener("click", handleClick); };
  }, [previewHtml]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[640px]"
    >
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        {/* Label bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <PreviewDot />
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Email Preview
          </span>
          <div className="flex-1" />
          {activeSection && (
            <button
              type="button"
              onClick={() => onSectionClick?.(null)}
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-[#0F8EFF] text-white transition-colors"
            >
              {activeSection} ✕
            </button>
          )}
        </div>
        <iframe
          ref={iframeRef}
          title="Email preview"
          className="w-full min-h-[600px] border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating right panel: HTML Source editor                            */
/* ------------------------------------------------------------------ */

/** Identify which section each line of the generated HTML belongs to.
 *  Only maps lines inside <body>, skipping CSS style rules that share
 *  the same class names (e.g. .email-header in <style>). */
function mapLineSections(html: string): CodeSection[] {
  const lines = html.split("\n");
  const sections: CodeSection[] = new Array(lines.length).fill(null);
  let inBody = false;
  let current: CodeSection = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inBody) {
      if (l.includes("<body")) inBody = true;
      continue;
    }
    // Use class= attribute to match actual HTML elements, not CSS rules
    if (l.includes('class="hero-image"')) { sections[i] = "image"; continue; }
    if (l.includes('class="email-header"')) { current = "headline"; }
    if (l.includes('class="email-body"')) { current = "body"; }
    if (l.includes('class="cta-button"')) { sections[i] = "cta"; continue; }
    if (l.includes('class="email-footer"')) { current = "footer"; }
    if (l.includes("</div>") && (current === "headline" || current === "footer")) {
      sections[i] = current; current = null; continue;
    }
    if (current) sections[i] = current;
  }
  return sections;
}

/** Tokenize a single HTML line into colored spans. */
function tokenizeHtmlLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Regex to pick tags, attributes, strings, and text
  const re = /(<\/?)([\w-]+)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?>)|(&[\w#]+;)|([^<&]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  const attrRe = /([\w-]+)(=)("[^"]*"|'[^']*')/g;
  while ((m = re.exec(line)) !== null) {
    if (m[1] !== undefined && m[2] !== undefined) {
      // Tag: <tag attrs>
      tokens.push(<span key={key++} className="text-[var(--text-muted)]">{m[1]}</span>);
      tokens.push(<span key={key++} className="text-[#D1395C]">{m[2]}</span>);
      if (m[3]) {
        // Attributes
        const attrStr = m[3];
        let am: RegExpExecArray | null;
        let lastIdx = 0;
        attrRe.lastIndex = 0;
        while ((am = attrRe.exec(attrStr)) !== null) {
          if (am.index > lastIdx) {
            tokens.push(<span key={key++} className="text-[var(--text-primary)]">{attrStr.slice(lastIdx, am.index)}</span>);
          }
          tokens.push(<span key={key++} className="text-[#2E844A]">{am[1]}</span>);
          tokens.push(<span key={key++} className="text-[var(--text-muted)]">{am[2]}</span>);
          tokens.push(<span key={key++} className="text-[#0F8EFF]">{am[3]}</span>);
          lastIdx = am.index + am[0].length;
        }
        if (lastIdx < attrStr.length) {
          tokens.push(<span key={key++} className="text-[var(--text-primary)]">{attrStr.slice(lastIdx)}</span>);
        }
      }
      tokens.push(<span key={key++} className="text-[var(--text-muted)]">{m[4]}</span>);
    } else if (m[5]) {
      // Entity like &amp;
      tokens.push(<span key={key++} className="text-[#92400E]">{m[5]}</span>);
    } else if (m[6]) {
      // Text content
      tokens.push(<span key={key++} className="text-[var(--text-primary)]">{m[6]}</span>);
    }
  }
  if (tokens.length === 0) tokens.push(<span key={0}>{line || "\n"}</span>);
  return tokens;
}

function CodeSourcePanel({ touchpoint, contact, atomicBlocks, updateAtomicBlock, activeSection, onSectionClick }: PaneProps) {
  const [html, setHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const generated = contentBlockToHtml(touchpoint.content);
    setHtml(generated);
  }, [touchpoint.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const lineSections = useMemo(() => mapLineSections(html), [html]);

  // Auto-scroll when activeSection changes externally (e.g. from preview panel)
  useEffect(() => {
    if (!activeSection || !scrollRef.current) return;
    const idx = lineSections.indexOf(activeSection);
    if (idx < 0) return;
    const lineH = 20;
    scrollRef.current.scrollTo({ top: Math.max(0, idx * lineH - 60), behavior: "smooth" });
  }, [activeSection, lineSections]);

  const scrollToSection = useCallback(
    (section: CodeSection) => {
      onSectionClick?.(section);
      if (!section || !scrollRef.current) return;
      const idx = lineSections.indexOf(section);
      if (idx < 0) return;
      const lineH = 20; // approx line height
      scrollRef.current.scrollTo({ top: Math.max(0, idx * lineH - 60), behavior: "smooth" });
    },
    [lineSections, onSectionClick],
  );

  const syncToStore = useCallback(
    (source: string) => {
      const parsed = htmlToContentBlockFields(source);
      const channel = touchpoint.channel;
      const atomIds = channel.atomicBlocks;
      const atoms = atomIds
        .map((id) => atomicBlocks.find((a) => a.id === id))
        .filter(Boolean) as typeof atomicBlocks;

      for (const atom of atoms) {
        if (atom.type === "headline" && atom.content !== parsed.headline) {
          updateAtomicBlock(atom.id, { content: parsed.headline });
        } else if (atom.type === "body" && atom.content !== parsed.body) {
          updateAtomicBlock(atom.id, { content: parsed.body });
        } else if (atom.type === "cta" && atom.content !== parsed.cta.text) {
          updateAtomicBlock(atom.id, { content: parsed.cta.text });
        } else if (atom.type === "image" && parsed.imagePlaceholder && atom.content !== parsed.imagePlaceholder) {
          updateAtomicBlock(atom.id, { content: parsed.imagePlaceholder });
        }
      }
    },
    [touchpoint.channel, atomicBlocks, updateAtomicBlock],
  );

  const handleChange = useCallback(
    (value: string) => {
      setHtml(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => syncToStore(value), 600);
    },
    [syncToStore],
  );

  const lines = html.split("\n");

  return (
    <div
      className="pointer-events-auto absolute right-2 top-2 bottom-2 flex w-[380px] max-w-[calc(100vw-300px)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
      style={{ zIndex: "var(--z-panel)" }}
    >
      {/* Header */}
      <div className="flex h-[42px] shrink-0 items-center justify-between px-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <CodeBrackets className="w-4 h-4 text-[#0F8EFF]" />
          <span className="text-[13px] font-bold text-[var(--text-primary)]">HTML Source</span>
        </div>
        <span className="text-[13px] tabular-nums text-[var(--text-muted)]">
          {html.length.toLocaleString()} chars
        </span>
      </div>

      {/* Section quick nav — fixed above scrollable code */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0 z-10">
        {(["image", "headline", "body", "cta", "footer"] as CodeSection[]).map((s) => (
          <button
            key={s!}
            type="button"
            onClick={() => scrollToSection(activeSection === s ? null : s)}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide transition-colors",
              activeSection === s
                ? "bg-[#0F8EFF]/10 text-[#0F8EFF]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background)]",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Syntax-highlighted editor */}
      <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-auto">
        <div className="relative min-h-full">
          {/* Highlighted lines layer — sets the natural content height */}
          <pre
            className="py-4 pl-[3.5rem] pr-4 font-mono text-[13px] leading-[20px] pointer-events-none whitespace-pre-wrap break-all select-none"
            aria-hidden
          >
            {lines.map((line, i) => {
              const section = lineSections[i];
              const isHighlighted = activeSection && section === activeSection;
              return (
                <div
                  key={i}
                  className={cn(
                    "transition-colors duration-150 -mx-4 px-4",
                    isHighlighted && "bg-[#0F8EFF]/8 border-l-2 border-l-[#0F8EFF] !pl-[calc(1rem-2px)]",
                  )}
                >
                  {tokenizeHtmlLine(line)}
                </div>
              );
            })}
          </pre>

          {/* Editable textarea — sits on top, stretched to match pre height */}
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            className={cn(
              "absolute inset-0 w-full h-full resize-none bg-transparent py-4 pl-[3.5rem] pr-4 font-mono text-[13px] leading-[20px] text-transparent caret-[#181818] whitespace-pre-wrap break-all",
              "outline-none selection:bg-[#0F8EFF]/15",
            )}
          />

          {/* Line numbers */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-0 w-[3rem] select-none overflow-hidden border-r border-[#E5E5E5] bg-[#FAFAFA] py-4 pr-2 text-right font-mono text-[13px] leading-[20px] text-[var(--text-muted)]"
          >
            {lines.map((_, i) => {
              const section = lineSections[i];
              const isHighlighted = activeSection && section === activeSection;
              return (
                <div key={i} className={cn(isHighlighted && "text-[#0F8EFF]")}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SMS Pane                                                           */
/* ------------------------------------------------------------------ */

const SMS_SEGMENT_SIZE = 160;
const SMS_CONCAT_SEGMENT_SIZE = 153;
const SMS_WARNING_THRESHOLD = 140;

function smsSegmentCount(len: number): number {
  if (len === 0) return 0;
  if (len <= SMS_SEGMENT_SIZE) return 1;
  return Math.ceil(len / SMS_CONCAT_SEGMENT_SIZE);
}

/** Phone preview only — centered in the visible area */
function SMSPhonePreview({ touchpoint, contact }: PaneProps) {
  const personalizedBody = useMemo(
    () => personalizeContent(touchpoint.content.body, contact),
    [touchpoint.content.body, contact],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-[300px]">
        <div className="rounded-[40px] bg-[#1A1A1A] p-3 shadow-xl">
          {/* Notch */}
          <div className="flex h-8 items-center justify-center rounded-t-[28px] bg-[#1A1A1A]">
            <div className="h-6 w-24 rounded-full bg-[#0A0A0A]" />
          </div>
          {/* Screen */}
          <div className="overflow-hidden rounded-[28px] bg-[var(--surface)]">
            {/* Status bar */}
            <div className="flex h-6 items-center justify-between bg-[#F5F5F5] px-6 text-[13px] text-[var(--text-muted)]">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
            {/* Conversation chrome */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <span className="text-[14px] text-blue-500">&larr;</span>
              <div className="flex-1 text-center">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Salesforce Palette</p>
                <p className="text-[13px] text-[var(--text-muted)]">SMS</p>
              </div>
              <div className="w-5" />
            </div>
            {/* Message bubbles */}
            <div className="min-h-[380px] px-4 py-5">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-3 text-[14px] leading-relaxed text-white whitespace-pre-wrap">
                  {personalizedBody || <span className="italic opacity-50">Type a message...</span>}
                </div>
              </div>
              <div className="mt-1.5 flex justify-end">
                <span className="text-[13px] text-[var(--text-muted)]">Just now &checkmark;&checkmark;</span>
              </div>
            </div>
            {/* Input bar */}
            <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2">
              <div className="flex h-9 flex-1 items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 text-[13px] text-[var(--text-muted)]">
                Text Message
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] text-[13px] text-white">
                &uarr;
              </div>
            </div>
            {/* Home indicator */}
            <div className="flex h-8 items-center justify-center">
              <div className="h-1 w-32 rounded-full bg-[#D4D4D4]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Floating right panel: SMS editor */
function SMSEditorPanel({ touchpoint, contact, atomicBlocks, updateAtomicBlock }: PaneProps) {
  const [body, setBody] = useState(touchpoint.content.body);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBody(touchpoint.content.body);
  }, [touchpoint.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const personalizedBody = useMemo(
    () => personalizeContent(body, contact),
    [body, contact],
  );

  const charCount = personalizedBody.length;
  const segments = smsSegmentCount(charCount);
  const isNearLimit = charCount >= SMS_WARNING_THRESHOLD && charCount <= SMS_SEGMENT_SIZE;
  const isOverSegment = charCount > SMS_SEGMENT_SIZE;

  const syncToStore = useCallback(
    (text: string) => {
      const channel = touchpoint.channel;
      const atomIds = channel.atomicBlocks;
      const atoms = atomIds
        .map((id) => atomicBlocks.find((a) => a.id === id))
        .filter(Boolean) as typeof atomicBlocks;

      for (const atom of atoms) {
        if (atom.type === "body" && atom.content !== text) {
          updateAtomicBlock(atom.id, { content: text });
        }
      }
    },
    [touchpoint.channel, atomicBlocks, updateAtomicBlock],
  );

  const handleChange = useCallback(
    (value: string) => {
      setBody(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => syncToStore(value), 400);
    },
    [syncToStore],
  );

  return (
    <div
      className="pointer-events-auto absolute right-2 top-2 bottom-2 flex w-[380px] max-w-[calc(100vw-300px)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
      style={{ zIndex: "var(--z-panel)" }}
    >
      {/* Header */}
      <div className="flex h-[42px] shrink-0 items-center gap-2 px-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <SMSIcon className="h-4 w-4 text-[#0F8EFF]" />
        <span className="text-[13px] font-bold text-[var(--text-primary)]">SMS Editor</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Sender info */}
        <div className="rounded border border-[var(--border)] bg-[#FAFAFA] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Sender</p>
          <p className="mt-1 text-[13px] font-bold text-[var(--text-primary)]">Salesforce Palette</p>
        </div>

        {/* Message body */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Message body
          </label>
          <textarea
            value={body}
            onChange={(e) => handleChange(e.target.value)}
            rows={6}
            placeholder="Type your SMS message..."
            className={cn(
              "w-full resize-none rounded border bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] outline-none transition-colors",
              "placeholder:text-[var(--text-muted)] focus:shadow-[0_0_3px_#0F8EFF]",
              isOverSegment
                ? "border-amber-300 focus:border-amber-400"
                : "border-[var(--border)] focus:border-[#0F8EFF]",
            )}
          />
        </div>

        {/* Character counter */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[18px] font-bold tabular-nums",
                  charCount === 0
                    ? "text-[#DDDBDA]"
                    : isOverSegment
                      ? "text-amber-500"
                      : isNearLimit
                        ? "text-orange-500"
                        : "text-[var(--text-primary)]",
                )}
              >
                {charCount}
              </span>
              <span className="text-[13px] text-[var(--text-muted)]">/ {SMS_SEGMENT_SIZE}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">
              {segments === 0
                ? "Empty message"
                : segments === 1
                  ? "Single SMS segment"
                  : `${segments} SMS segments (concatenated)`}
            </p>
          </div>
          <CharacterRing current={charCount} max={SMS_SEGMENT_SIZE} />
        </div>

        {/* Feedback banners */}
        {isNearLimit && (
          <div className="flex items-center gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-2">
            <span className="text-[13px]">&#9888;&#65039;</span>
            <p className="text-[13px] text-orange-700">
              Approaching the {SMS_SEGMENT_SIZE}-char limit.
            </p>
          </div>
        )}
        {isOverSegment && (
          <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-[13px]">&#128279;</span>
            <p className="text-[13px] text-amber-700">
              <strong>{segments} concatenated segments</strong> ({SMS_CONCAT_SEGMENT_SIZE} chars each).
            </p>
          </div>
        )}

        {/* Variable hint */}
        <div className="rounded border border-dashed border-[var(--border)] bg-[#FAFAFA] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Variables</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["{{first_name}}", "{{last_name}}", "{{company}}"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleChange(body + v)}
                className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[13px] text-[var(--text-primary)] transition-colors hover:border-[#0F8EFF] hover:bg-[#EBF5FE] hover:text-[#0F8EFF]"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Character Ring                                                     */
/* ------------------------------------------------------------------ */

function CharacterRing({ current, max }: { current: number; max: number }) {
  const size = 48;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(current / max, 1);
  const offset = circumference - ratio * circumference;

  const color =
    current > max
      ? "#f59e0b"
      : current >= max * 0.875
        ? "#f97316"
        : current > 0
          ? "#3b82f6"
          : "#e5e7eb";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-200"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function PreviewDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function CodeBrackets({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function SMSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EmailChIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function WhatsAppChIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
