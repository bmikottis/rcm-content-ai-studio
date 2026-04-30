"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useProjectsStore } from "@/stores/projects";
import { useComposerStore } from "@/stores/composer";
import { useCampaignCreationStore } from "@/stores/campaign-creation";
import { AttachmentsMenu } from "@/components/composer/AttachmentsMenu";
import { BriefMenu } from "@/components/composer/BriefMenu";
import { BrandKitMenu } from "@/components/composer/BrandKitMenu";
import { ChannelsMenu } from "@/components/composer/ChannelsMenu";
import { AssetsPopover } from "@/components/composer/popovers/AssetsPopover";
import { Attachment } from "@/types/composer";
import { cn } from "@/lib/cn";

const briefRelations: Record<string, {
  brandId: string;
  channelIds: string[];
  assets: { id: string; name: string; type: Attachment["type"]; size?: string }[];
}> = {
  "brief-1": {
    brandId: "brand-1",
    channelIds: ["email", "sms"],
    assets: [
      { id: "b1-1", name: "hero-banner.jpg", type: "image", size: "2.4 MB" },
      { id: "b1-2", name: "product-specs.pdf", type: "pdf", size: "1.1 MB" },
    ],
  },
  "brief-2": {
    brandId: "brand-2",
    channelIds: ["email", "push", "landing-page"],
    assets: [
      { id: "b2-1", name: "Holiday collection", type: "image", size: "8 files" },
      { id: "b2-2", name: "promo-guidelines.pdf", type: "pdf", size: "640 KB" },
    ],
  },
  "brief-3": {
    brandId: "brand-3",
    channelIds: ["email", "whatsapp"],
    assets: [
      { id: "b3-1", name: "Win-back creatives", type: "image", size: "5 files" },
    ],
  },
};

/* ── Clarifying questions shown when no brief / brand / assets are attached ── */

interface ClarifyQuestion {
  id: string;
  question: string;
  options: { key: string; label: string; action?: "open-brief" | "open-assets" }[];
}

const clarifyQuestions: ClarifyQuestion[] = [
  {
    id: "grounding",
    question: "Do you have a brief or images you'd like to include?",
    options: [
      { key: "A", label: "Yes, I'll attach a brief", action: "open-brief" },
      { key: "B", label: "Yes, I have images or files", action: "open-assets" },
      { key: "C", label: "No, generate from scratch" },
    ],
  },
  {
    id: "goal",
    question: "What's the primary goal of this content?",
    options: [
      { key: "A", label: "Drive conversions & sales" },
      { key: "B", label: "Build brand awareness" },
      { key: "C", label: "Engage & retain customers" },
      { key: "D", label: "Educate or inform the audience" },
    ],
  },
  {
    id: "tone",
    question: "What tone should the content convey?",
    options: [
      { key: "A", label: "Professional & authoritative" },
      { key: "B", label: "Warm & conversational" },
      { key: "C", label: "Playful & energetic" },
      { key: "D", label: "Minimalist & direct" },
    ],
  },
];

type ClarifyPhase = null | {
  step: number;
  answers: Record<string, string>;
  prompt: string;
};

const examplePrompts = [
  "Create a Mother's Day email campaign with gift recommendations",
  "Design a welcome SMS series for new loyalty members",
  "Build a summer sale landing page with countdown timer",
  "Write a WhatsApp drip campaign for abandoned carts",
  "Generate a holiday gift guide email with product cards",
  "Create a flash sale push notification sequence",
  "Design a re-engagement email for inactive subscribers",
  "Build a product launch campaign across email and SMS",
  "Write a seasonal newsletter featuring new arrivals",
  "Create a VIP exclusive early-access campaign",
];

interface HomeCommandBarProps {
  className?: string;
}

export function HomeCommandBar({ className }: HomeCommandBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);
  const [linkedBrandId, setLinkedBrandId] = useState<string | null>(null);
  const [linkedChannelIds, setLinkedChannelIds] = useState<Set<string> | undefined>(undefined);

  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [clarifyPhase, setClarifyPhase] = useState<ClarifyPhase>(null);
  const briefMenuRef = useRef<{ open: () => void }>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { setPrompt } = useProjectsStore();
  const composerState = useComposerStore();
  const { attachments, addAttachment, removeAttachment, clearAttachments } = composerState;
  const { startCreation, isCreating } = useCampaignCreationStore();

  const handleBriefSelect = useCallback((briefId: string | null) => {
    setActiveBriefId(briefId);
    clearAttachments();
    if (briefId && briefRelations[briefId]) {
      const rel = briefRelations[briefId];
      setLinkedBrandId(rel.brandId);
      setLinkedChannelIds(new Set(rel.channelIds));
      for (const asset of rel.assets) {
        addAttachment({
          id: `brief-asset-${asset.id}`,
          type: asset.type,
          name: asset.name,
          size: asset.size,
          source: "existing",
        });
      }
      setClarifyPhase(null);
    } else {
      setLinkedBrandId(null);
      setLinkedChannelIds(undefined);
    }
  }, [addAttachment, clearAttachments]);

  const handleManualBrandChange = useCallback(() => {}, []);
  const handleManualChannelChange = useCallback(() => {}, []);

  useEffect(() => {
    setPrompt(value);
  }, [value, setPrompt]);

  const hasGrounding = Boolean(activeBriefId) || Boolean(linkedBrandId) || attachments.length > 0;

  const executeSubmit = useCallback(async (prompt: string, context?: Record<string, string>) => {
    if (!isAuthenticated) {
      openLoginModal(prompt);
      return;
    }
    let finalPrompt = prompt;
    if (context && Object.keys(context).length > 0) {
      const parts: string[] = [];
      if (context.goal) parts.push(`Goal: ${context.goal}`);
      if (context.tone) parts.push(`Tone: ${context.tone}`);
      if (parts.length > 0) finalPrompt = `${prompt}\n\n[Context]\n${parts.join("\n")}`;
    }
    try {
      await startCreation(finalPrompt, composerState);
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  }, [isAuthenticated, openLoginModal, startCreation, composerState]);

  const handleSubmit = useCallback(async () => {
    if (isCreating) return;
    const p = value.trim();
    if (!p) return;

    if (!hasGrounding) {
      setClarifyPhase({ step: 0, answers: {}, prompt: p });
      return;
    }

    await executeSubmit(p);
  }, [value, isCreating, hasGrounding, executeSubmit]);

  const handleClarifySelect = useCallback((questionId: string, answer: string, action?: "open-brief" | "open-assets") => {
    setClarifyPhase((prev) => {
      if (!prev) return null;

      if (action === "open-brief") {
        // Dismiss clarify flow so user can attach a brief via the toolbar
        setTimeout(() => inputRef.current?.focus(), 100);
        return null;
      }
      if (action === "open-assets") {
        setIsAssetsOpen(true);
        return null;
      }

      const newAnswers = { ...prev.answers, [questionId]: answer };
      const nextStep = prev.step + 1;

      if (nextStep >= clarifyQuestions.length) {
        // All questions answered — submit
        void executeSubmit(prev.prompt, newAnswers);
        return null;
      }

      return { ...prev, step: nextStep, answers: newAnswers, prompt: prev.prompt };
    });
  }, [executeSubmit]);

  const handleClarifySkip = useCallback(() => {
    setClarifyPhase((prev) => {
      if (!prev) return null;
      void executeSubmit(prev.prompt, prev.answers);
      return null;
    });
  }, [executeSubmit]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleAssetSelect = useCallback((asset: { id: string; name: string; type: string; size?: string; source: string }) => {
    const attachment: Attachment = {
      id: `asset-${asset.id}-${Date.now()}`,
      type: "asset",
      name: asset.name,
      size: asset.size,
      source: "existing",
    };
    addAttachment(attachment);
  }, [addAttachment]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "BUTTON" && !target.closest("button") && !target.closest("[data-popover]") && !target.closest("[data-menu]")) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={cn("w-full canvas-app !bg-transparent", className)}>
      <div className="pointer-events-auto w-full mx-auto">
        <div
          onClick={handleContainerClick}
          className={cn(
            "relative rounded-[20px] overflow-visible cursor-text transition-all duration-200",
            "bg-[var(--surface)] shadow-sm border border-transparent",
            isCreating ? "gradient-glow" : "gradient-border",
          )}
        >
          <div className="relative">
            {/* Clarifying questions panel */}
            <AnimatePresence>
              {clarifyPhase && (
                <motion.div
                  key="clarify-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-b border-[var(--border)]"
                >
                  <div className="px-5 pt-5 pb-4">
                    <AnimatePresence mode="wait">
                      {(() => {
                        const q = clarifyQuestions[clarifyPhase.step];
                        return (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-white">{clarifyPhase.step + 1}</span>
                              </div>
                              <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                                {q.question}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 ml-[30px]">
                              {q.options.map((opt, i) => (
                                <motion.button
                                  key={opt.key}
                                  type="button"
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.04 * i, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleClarifySelect(q.id, opt.label, opt.action);
                                  }}
                                  className={cn(
                                    "w-full text-left rounded-xl border px-4 py-3 transition-colors flex items-center gap-3",
                                    "border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                                    "hover:border-[var(--border)] hover:bg-[var(--surface-hover)]",
                                  )}
                                >
                                  <span className="w-6 h-6 rounded-md bg-[var(--surface-active)] flex items-center justify-center text-[12px] font-bold text-[var(--text-secondary)] flex-shrink-0">
                                    {opt.key}
                                  </span>
                                  <span className="text-[13px] text-[var(--text-primary)] leading-snug">{opt.label}</span>
                                </motion.button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); handleClarifySkip(); }}
                              className="ml-[30px] mt-1 text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                              Skip — generate now →
                            </button>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline input row */}
            <div className="flex items-start gap-0 px-5 pt-4 pb-0">
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => { if (!clarifyPhase) setValue(e.target.value); }}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isCreating || !!clarifyPhase}
                rows={clarifyPhase ? 1 : 3}
                className={cn(
                  "flex-1 min-w-0 bg-transparent resize-none pt-[2px] pb-3",
                  "text-[13px] leading-relaxed font-normal",
                  "focus:outline-none selection:bg-blue-100",
                  clarifyPhase ? "min-h-[24px]" : "min-h-[72px]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "disabled:opacity-60",
                  "transition-[min-height] duration-200",
                )}
              />
            </div>

            {/* Rotating placeholder prompts — positioned over the textarea */}
            {!value && !clarifyPhase && (
              <div className="absolute top-[18px] left-5 right-5 pointer-events-none overflow-hidden h-[22px]">
                {isFocused ? (
                  <span className="text-[13px] leading-relaxed text-[var(--text-muted)]">
                    Ask Agentforce…
                  </span>
                ) : (
                  examplePrompts.map((prompt, i) => {
                    const isActive = i === promptIndex;
                    const isPrev = i === (promptIndex - 1 + examplePrompts.length) % examplePrompts.length;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 left-0 right-0 text-[13px] leading-relaxed text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        style={{
                          opacity: isActive ? 1 : 0,
                          transform: isActive
                            ? "translateX(0)"
                            : isPrev
                              ? "translateX(30px)"
                              : "translateX(-10px)",
                        }}
                      >
                        {prompt}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Attachment chips — above the toolbar line */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 px-5 pb-3"
                >
                  {attachments.map((att) => (
                    <motion.div
                      key={att.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-md bg-[var(--surface-active)] border border-[var(--border)]"
                    >
                      <AssetChipIcon className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-[12px] text-[var(--text-secondary)] max-w-[120px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }}
                        className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-neutral-600 hover:bg-neutral-200 transition-colors"
                      >
                        <CloseChipIcon className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-[var(--border)]">
              {/* Left: Attachments + Brief | Brand Kit + Channels */}
              <div className="flex items-center gap-2">
                <AttachmentsMenu variant="light" />
                <BriefMenu
                  variant="light"
                  onBriefSelect={handleBriefSelect}
                  controlledBriefId={activeBriefId}
                />
                <div className="h-4 w-px mx-1 bg-neutral-200" />
                <BrandKitMenu
                  variant="light"
                  externalBrandId={linkedBrandId}
                  onManualSelect={handleManualBrandChange}
                />
                <div className="relative" data-popover>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsAssetsOpen(!isAssetsOpen); }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 border",
                      attachments.length > 0
                        ? "bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-100"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                      isAssetsOpen && "ring-1 ring-neutral-300",
                    )}
                  >
                    <FolderIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="relative">
                      <span className="invisible whitespace-nowrap">Assets</span>
                      <span className="absolute inset-0 truncate">{attachments.length > 0 ? `${attachments.length} asset${attachments.length > 1 ? "s" : ""}` : "Assets"}</span>
                    </span>
                  </button>
                  <AssetsPopover
                    isOpen={isAssetsOpen}
                    onClose={() => setIsAssetsOpen(false)}
                    variant="light"
                    onAssetSelect={handleAssetSelect}
                  />
                </div>
                <ChannelsMenu
                  variant="light"
                  externalChannelIds={linkedChannelIds}
                  onManualToggle={handleManualChannelChange}
                />
              </div>

              {/* Right: Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSubmit();
                  }}
                  disabled={isCreating || !!clarifyPhase || !value.trim()}
                  className={cn(
                    "w-9 h-9 rounded-full flex-shrink-0",
                    "flex items-center justify-center",
                    "transition-all duration-200 active:scale-95",
                    !isCreating && !clarifyPhase && value.trim()
                      ? "bg-neutral-900 text-white hover:bg-neutral-800"
                      : "bg-[var(--surface-active)] text-neutral-300",
                  )}
                >
                  {isCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <SpinnerIcon className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <ArrowIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-center text-[13px] mt-5 mb-2 text-white/60">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[13px] mx-0.5">&#x21B5;</kbd> to generate
        </p>
      </div>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function AssetChipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CloseChipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
