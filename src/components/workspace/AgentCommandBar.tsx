"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationStore } from "@/stores/conversation";
import { useWorkspaceStore } from "@/stores/workspace";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useToolsStore } from "@/stores/tools";
import { getEditingContextLabel, getAgentScopeCanvasIds } from "@/lib/editing-context";
import { buildRefinementSuggestions, type RefinementBundle } from "@/lib/vibe-prompt-refinements";
import { AttachmentsMenu } from "@/components/composer/AttachmentsMenu";
import { BriefMenu } from "@/components/composer/BriefMenu";
import { BrandKitMenu } from "@/components/composer/BrandKitMenu";
import { ChannelsMenu } from "@/components/composer/ChannelsMenu";
import { cn } from "@/lib/cn";
import { useThemeStore } from "@/stores/theme";

type RefinementState =
  | null
  | { phase: "thinking"; original: string }
  | { phase: "ready"; original: string; bundle: RefinementBundle };

const REFINEMENT_THINKING_MS = 980;

const CLARIFY_EVERY_N = 3;

const clarifyingQuestions = [
  {
    question: "What tone should the content convey?",
    options: [
      { key: "A", label: "Professional and authoritative" },
      { key: "B", label: "Warm and conversational" },
      { key: "C", label: "Playful and energetic" },
      { key: "D", label: "Minimalist and direct" },
    ],
  },
  {
    question: "Who is the primary audience for this?",
    options: [
      { key: "A", label: "New customers / prospects" },
      { key: "B", label: "Existing loyal customers" },
      { key: "C", label: "Lapsed customers to re-engage" },
      { key: "D", label: "Internal stakeholders / partners" },
    ],
  },
  {
    question: "What is the primary goal of this change?",
    options: [
      { key: "A", label: "Drive conversions / sales" },
      { key: "B", label: "Increase brand awareness" },
      { key: "C", label: "Improve engagement metrics" },
      { key: "D", label: "Provide information / educate" },
    ],
  },
];

type AgentPhase =
  | null
  | { phase: "analyzing"; prompt: string }
  | { phase: "clarify"; prompt: string; questionIndex: number };

export function AgentCommandBar() {
  const isDark = useThemeStore((s) => s.resolvedTheme === "dark");
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [refinement, setRefinement] = useState<RefinementState>(null);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>(null);
  const promptCountRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const collapsedInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const refinementTimerRef = useRef<number | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 500);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { sendPrompt, isThinking } = useConversationStore();
  const {
    groups,
    atomicBlocks,
    selectedIds,
    focusedChannel,
    setAgentOverlay,
  } = useWorkspaceStore();
  const {
    showContextPanel,
    agentPanelHistoryOnly,
    openAgentHistoryPanel,
    closeAgentPanel,
  } = useToolsStore();

  const { selectedCardId: simpleSelectedCardId, selectedCardIds: simpleSelectedCardIds, selectedElement: simpleSelectedElement, cards: simpleCards, updateElement: simpleUpdateElement, updateCard: simpleUpdateCard, addVariant: simpleAddVariant, replaceImage: simpleReplaceImage, setImageVariations: simpleSetImageVariations, addGeneratedImages: simpleAddGeneratedImages, initialGenPhase, revealReserveTemplate } = useSimpleCanvasStore();

  const simpleCanvasContext = useMemo(() => {
    // Multi-selection context
    if (simpleSelectedCardIds.length > 1) {
      const titles = simpleSelectedCardIds
        .map((id) => simpleCards.find((c) => c.id === id)?.title)
        .filter(Boolean);
      return {
        label: `${simpleSelectedCardIds.length} content selected`,
        context: titles.slice(0, 3).join(", ") + (titles.length > 3 ? ` +${titles.length - 3} more` : ""),
      };
    }
    // Single selection
    if (!simpleSelectedCardId) return null;
    const card = simpleCards.find((c) => c.id === simpleSelectedCardId);
    if (!card) return null;
    if (simpleSelectedElement) {
      const el = card.elements.find((e) => e.id === simpleSelectedElement.elementId);
      if (el) return { label: el.content || el.type, context: `${el.type} in ${card.title}` };
    }
    return { label: card.title, context: `${card.channel.charAt(0).toUpperCase() + card.channel.slice(1)} channel` };
  }, [simpleSelectedCardId, simpleSelectedCardIds, simpleSelectedElement, simpleCards]);

  // Drive the analyzing UI when the canvas is running its initial generation
  useEffect(() => {
    if (initialGenPhase === "analyzing" || initialGenPhase === "generating") {
      setAgentPhase({ phase: "analyzing", prompt: "" });
    } else if (initialGenPhase === "complete" || initialGenPhase === null) {
      setAgentPhase((prev) => {
        if (prev?.phase === "analyzing" && prev.prompt === "") return null;
        return prev;
      });
    }
  }, [initialGenPhase]);

  // Auto-expand when there is active processing
  useEffect(() => {
    if (isThinking || refinement || agentPhase) setExpanded(true);
  }, [isThinking, refinement, agentPhase]);

  // Collapse on click outside
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        if (!isThinking && !refinement && !agentPhase) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded, isThinking, refinement, agentPhase]);

  const contextLabel = useMemo(
    () => simpleCanvasContext?.context ?? getEditingContextLabel(groups, atomicBlocks, selectedIds, focusedChannel),
    [groups, atomicBlocks, selectedIds, focusedChannel, simpleCanvasContext],
  );

  const selectionPillLabel = useMemo(() => {
    if (simpleCanvasContext) return simpleCanvasContext.label;
    if (selectedIds.length === 0) return null;
    if (selectedIds.length > 1) return `${selectedIds.length} elements`;
    const id = selectedIds[0];
    const block = atomicBlocks.find((b) => b.id === id);
    if (block) return block.content;
    const group = groups.find((g) => g.id === id);
    if (group) return group.name;
    return "Selected";
  }, [selectedIds, atomicBlocks, groups, simpleCanvasContext]);

  const generateNewContent = useCallback((type: string, currentContent: string) => {
    if (type === "headline") {
      const headlines = [
        "Elevate Your Kitchen This Season",
        "Crafted for the Modern Home Chef",
        "Fresh Flavors, Timeless Style",
        "Your Table, Reimagined",
        "The Art of Everyday Cooking",
      ];
      return headlines.filter((h) => h !== currentContent)[Math.floor(Math.random() * (headlines.length - 1))] ?? headlines[0];
    } else if (type === "body") {
      const bodies = [
        "Discover our curated collection of premium essentials designed to transform your everyday cooking into an extraordinary experience. From farm to table, every detail matters.",
        "We've handpicked the finest ingredients and tools to help you create memorable meals. Explore what's new and find your next kitchen inspiration.",
        "This season brings a fresh perspective on home entertaining. Whether you're hosting or cooking for yourself, we have something special waiting for you.",
      ];
      return bodies.filter((b) => b !== currentContent)[Math.floor(Math.random() * (bodies.length - 1))] ?? bodies[0];
    } else if (type === "cta") {
      const ctas = ["Shop the Collection", "Explore Now", "Get Started", "Discover More", "See What's New"];
      return ctas.filter((c) => c !== currentContent)[Math.floor(Math.random() * (ctas.length - 1))] ?? ctas[0];
    }
    return currentContent;
  }, []);

  const simulateCanvasUpdate = useCallback(
    (prompt: string, duration = 3500) => {
      const card = simpleSelectedCardId
        ? simpleCards.find((c) => c.id === simpleSelectedCardId)
        : null;
      if (!card) return;

      // Detect variant generation prompts
      const lower = prompt.toLowerCase();
      if (lower.includes("variant")) {
        setTimeout(() => {
          simpleAddVariant(card.id);
        }, duration);
        return;
      }

      // Detect image generation / creation prompts
      const isImagePrompt = /\b(create|generate|make|new|replace|swap|change|update)\b.*\b(image|photo|picture|visual|graphic)\b/i.test(prompt)
        || /\b(image|photo|picture|visual|graphic)\b.*\b(for|of|with|about)\b/i.test(prompt);

      if (isImagePrompt) {
        // Find the target image element — either selected or first image in the card
        let imgCardId = card.id;
        let imgElId: string | null = null;

        if (simpleSelectedElement) {
          const el = card.elements.find((e) => e.id === simpleSelectedElement.elementId);
          if (el?.type === "image") imgElId = el.id;
        }
        if (!imgElId) {
          const imgEl = card.elements.find((e) => e.type === "image");
          if (imgEl) imgElId = imgEl.id;
        }

        if (imgElId) {
          const analyzeDelay = 800;
          const generateDelay = 2500;
          const variationsDelay = 600;
          setTimeout(() => {
            simpleUpdateElement(imgCardId, imgElId!, { isLoading: true });
          }, analyzeDelay);

          const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
          const batch = [
            { src: `${basePath}/images/ws/cutlery-1.jpg`, alt: "Williams Sonoma Cutlery Set — Option 1" },
            { src: `${basePath}/images/ws/cutlery-2.jpg`, alt: "Williams Sonoma Cutlery Set — Option 2" },
            { src: `${basePath}/images/ws/cutlery-3.jpg`, alt: "Williams Sonoma Cutlery Set — Option 3" },
            { src: `${basePath}/images/ws/cutlery-4.jpg`, alt: "Williams Sonoma Cutlery Set — Option 4" },
          ];
          setTimeout(() => {
            simpleReplaceImage(imgCardId, imgElId!, batch[0].src, batch[0].alt);
            simpleUpdateElement(imgCardId, imgElId!, { isLoading: false });
          }, analyzeDelay + generateDelay);

          setTimeout(() => {
            simpleSetImageVariations(imgCardId, imgElId!, batch);
            simpleAddGeneratedImages(batch);
          }, analyzeDelay + generateDelay + variationsDelay);
          return;
        }
      }

      let targetCardId = card.id;
      let targetElId: string | null = null;
      let targetType: string | null = null;
      let currentContent = "";

      if (simpleSelectedElement) {
        const el = card.elements.find((e) => e.id === simpleSelectedElement.elementId);
        if (el) {
          targetElId = el.id;
          targetType = el.type;
          currentContent = el.content;
        }
      }

      if (!targetElId) {
        const textEl = card.elements.find((e) => e.type === "headline" || e.type === "body");
        if (textEl) {
          targetElId = textEl.id;
          targetType = textEl.type;
          currentContent = textEl.content;
        }
      }

      if (!targetElId || !targetType) return;

      // Phase 1: Set loading skeleton
      simpleUpdateElement(targetCardId, targetElId, { isLoading: true });

      // Phase 2: After delay, swap in new content and clear loading
      const newContent = generateNewContent(targetType, currentContent);
      setTimeout(() => {
        simpleUpdateElement(targetCardId, targetElId!, { content: newContent, isLoading: false });
      }, duration);
    },
    [simpleSelectedCardId, simpleSelectedElement, simpleCards, simpleUpdateElement, simpleAddVariant, simpleReplaceImage, simpleSetImageVariations, simpleAddGeneratedImages, generateNewContent],
  );

  const runAgent = useCallback(
    async (prompt: string, activity: string) => {
      const scopeIds = getAgentScopeCanvasIds(
        groups,
        atomicBlocks,
        selectedIds,
        focusedChannel,
      );
      setAgentOverlay({ label: activity, scopeIds });
      try {
        await sendPrompt(prompt);
      } finally {
        setAgentOverlay(null);
      }
    },
    [groups, atomicBlocks, selectedIds, focusedChannel, sendPrompt, setAgentOverlay],
  );

  const clearRefinementTimer = useCallback(() => {
    if (refinementTimerRef.current != null) {
      window.clearTimeout(refinementTimerRef.current);
      refinementTimerRef.current = null;
    }
  }, []);

  const dismissRefinement = useCallback(() => {
    clearRefinementTimer();
    setRefinement(null);
  }, [clearRefinementTimer]);

  useEffect(() => () => clearRefinementTimer(), [clearRefinementTimer]);

  const beginRefinement = useCallback(
    (promptStr: string) => {
      const trimmed = promptStr.trim();
      if (!trimmed || isThinking) return;
      const bundle = buildRefinementSuggestions(trimmed, contextLabel);
      if (bundle.answers.length === 0) {
        setValue("");
        void runAgent(trimmed, "Updating…");
        return;
      }
      clearRefinementTimer();
      setRefinement({ phase: "thinking", original: trimmed });
      refinementTimerRef.current = window.setTimeout(() => {
        refinementTimerRef.current = null;
        setRefinement({ phase: "ready", original: trimmed, bundle });
      }, REFINEMENT_THINKING_MS);
    },
    [clearRefinementTimer, contextLabel, isThinking, runAgent],
  );

  const runWithOptionalRefinement = useCallback(
    async (original: string, detail: string | null) => {
      clearRefinementTimer();
      const final = detail
        ? `${original}\n\n[Context for the agent]: ${detail}`
        : original;
      setRefinement(null);
      setValue("");
      await runAgent(final, detail ? "Refining…" : "Updating…");
    },
    [clearRefinementTimer, runAgent],
  );

  const executeAgent = useCallback(
    async (prompt: string, extraContext?: string) => {
      const final = extraContext
        ? `${prompt}\n\n[Context]: ${extraContext}`
        : prompt;
      setAgentPhase(null);
      setValue("");
      await runAgent(final, "Updating…");
    },
    [runAgent],
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isThinking || agentPhase?.phase === "analyzing") return;

    // If we're in clarify phase and user hits send, run with original prompt
    if (agentPhase?.phase === "clarify") {
      await executeAgent(agentPhase.prompt);
      return;
    }

    // If in old refinement flow, handle it
    if (refinement) {
      if (refinement.phase === "thinking") return;
      const base = value.trim() || refinement.original;
      await runWithOptionalRefinement(base, null);
      return;
    }

    const p = value.trim();
    if (!p) return;

    const lower = p.toLowerCase();
    const isGenerateCmd = lower.includes("generate") || lower.includes("create") || lower.includes("new");
    const wantsEmail = lower.includes("email");
    const wantsSms = lower.includes("sms");

    if (isGenerateCmd && (wantsEmail || wantsSms)) {
      const channel = wantsEmail ? "email" as const : "sms" as const;
      setAgentPhase({ phase: "analyzing", prompt: p });
      setValue("");
      setTimeout(() => {
        const card = revealReserveTemplate(channel);
        if (card) {
          setTimeout(() => {
            useSimpleCanvasStore.getState().updateCard(card.id, { status: "ready" });
          }, 1500);
        }
        setAgentPhase(null);
      }, 2500);
      return;
    }

    promptCountRef.current += 1;
    const shouldClarify = promptCountRef.current % CLARIFY_EVERY_N === 0;

    // Show analyzing phase + start skeleton loader simultaneously
    setAgentPhase({ phase: "analyzing", prompt: p });
    setValue("");
    if (shouldClarify) {
      simulateCanvasUpdate(p, 4000);
      // After analyzing, show clarifying question
      setTimeout(() => {
        const qIdx = Math.floor((promptCountRef.current / CLARIFY_EVERY_N - 1)) % clarifyingQuestions.length;
        setAgentPhase({ phase: "clarify", prompt: p, questionIndex: qIdx });
      }, 4000);
    } else {
      simulateCanvasUpdate(p, 3500);
      // After analyzing, execute directly
      setTimeout(() => {
        setAgentPhase(null);
        void runAgent(p, "Updating…");
      }, 3500);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  useEffect(() => {
    if (!refinement) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        dismissRefinement();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refinement, dismissRefinement]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "BUTTON" && !target.closest("button") && !target.closest("[data-popover]")) {
      inputRef.current?.focus();
    }
  };

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showContextPanel && agentPanelHistoryOnly) {
      closeAgentPanel();
    } else {
      openAgentHistoryPanel();
    }
  };

  const pendingFocusRef = useRef(false);

  const expandComposer = () => {
    pendingFocusRef.current = true;
    setExpanded(true);
  };

  useEffect(() => {
    if (expanded && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      const tryFocus = (attempts = 0) => {
        if (inputRef.current) {
          inputRef.current.focus();
        } else if (attempts < 10) {
          requestAnimationFrame(() => tryFocus(attempts + 1));
        }
      };
      tryFocus();
    }
  }, [expanded]);

  const handleCollapsedSubmit = () => {
    if (!value.trim() || isThinking) return;
    setExpanded(true);
    void handleSubmit();
  };

  const handleCollapsedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCollapsedSubmit();
    }
  };

  return (
    <div
      className="pointer-events-none absolute bottom-[20px] flex justify-center px-4"
      style={{ left: "calc(300px + 24px)", right: "calc(300px + 24px)", zIndex: "var(--z-floating-controls)" }}
    >
      <motion.div
        ref={composerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-full max-w-[680px]"
      >
        <AnimatePresence initial={false}>
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={expandComposer}
              className={cn(
                "relative z-0 rounded-full overflow-visible cursor-text",
                "composer-agent-fill border border-transparent",
                isDark
                  ? "shadow-[0_4px_24px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.4)]"
                  : "shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.10)]",
                "gradient-border",
              )}
            >
              <div className="relative z-[1] flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full border backdrop-blur-sm text-[var(--text-secondary)] transition-all flex-shrink-0",
                    isDark
                      ? "border-white/[0.22] bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.24]"
                      : "border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-white/70",
                  )}
                  onClick={(e) => { e.stopPropagation(); expandComposer(); }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
                <input
                  ref={collapsedInputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onFocus={expandComposer}
                  onKeyDown={handleCollapsedKeyDown}
                  placeholder="Ask Agentforce…"
                  className="flex-1 min-w-0 bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCollapsedSubmit(); }}
                  disabled={isThinking || !value.trim()}
                  className={cn(
                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all border backdrop-blur-sm",
                    isDark
                      ? "border-white/[0.22] bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
                    value.trim()
                      ? isDark ? "text-[var(--text-primary)] hover:bg-white/[0.24]" : "text-[var(--text-primary)] hover:bg-white/70"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  <ArrowIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
        {/* Composer container — mirrors CampaignComposer light theme */}
        <div
          onClick={handleContainerClick}
          className={cn(
            "relative z-0 rounded-[20px] overflow-visible cursor-text transition-all duration-200",
            "composer-agent-fill border border-transparent",
            isDark
              ? "shadow-[0_4px_24px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.4)]"
              : "shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.10)]",
            (isThinking || refinement?.phase === "thinking" || agentPhase?.phase === "analyzing")
              ? "gradient-glow"
              : "gradient-border",
          )}
        >
          <div className="relative z-[1]">
            <AnimatePresence initial={false}>
              {refinement && (
                <motion.div
                  key="refinement-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "overflow-hidden rounded-t-[20px] border-b",
                    isDark
                      ? "border-white/10 bg-gradient-to-b from-[rgba(28,28,30,0.92)] to-[rgba(28,28,30,0.80)]"
                      : "border-[var(--border)] bg-gradient-to-b from-white/90 to-white/75",
                  )}
                >
                  <div className="px-4 pt-4 pb-4">
                    <AnimatePresence mode="wait">
                      {refinement.phase === "thinking" ? (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                              className="flex-shrink-0"
                            >
                              <SpinnerIcon className={cn("w-5 h-5", isDark ? "text-white/60" : "text-[var(--text-secondary)]")} />
                            </motion.div>
                            <div>
                              <p className={cn("text-[15px] font-semibold leading-snug", isDark ? "text-white" : "text-[var(--text-primary)]")}>
                                Thinking about your prompt…
                              </p>
                              <p className={cn("text-[13px] mt-0.5", isDark ? "text-white/60" : "text-[var(--text-secondary)]")}>
                                Shaping one follow-up question and a few replies you can choose from.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className={cn("h-[4.5rem] rounded-xl border", isDark ? "border-white/10 bg-white/[0.08]" : "border-[var(--border)] bg-[var(--surface-active)]")}
                                animate={{ opacity: [0.45, 0.85, 0.45] }}
                                transition={{
                                  duration: 1.25,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: i * 0.18,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ready"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="space-y-1"
                        >
                        <p className={cn("text-[11px] font-semibold uppercase tracking-wider mb-2", isDark ? "text-white/40" : "text-[var(--text-muted)]")}>
                          Agentforce
                        </p>
                        <p className={cn("text-heading-small pb-4", isDark ? "text-white" : "text-[var(--text-primary)]")}>
                          {refinement.bundle.agentQuestion}
                        </p>
                        <p className={cn("text-[13px] leading-relaxed -mt-2 pb-3", isDark ? "text-white/60" : "text-[var(--text-secondary)]")}>
                          Pick the answer that fits — or send your original prompt unchanged below.
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {refinement.bundle.answers.map((opt, index) => (
                            <motion.button
                              key={opt.id}
                              type="button"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.04 * index,
                                duration: 0.2,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (!isThinking) {
                                  const base = value.trim() || refinement.original;
                                  void runWithOptionalRefinement(base, opt.detail);
                                }
                              }}
                              disabled={isThinking}
                              className={cn(
                                "w-full text-left rounded-xl border px-4 py-4 transition-colors",
                                isDark
                                  ? "border-white/15 bg-white/[0.08] hover:border-white/25 hover:bg-white/[0.14]"
                                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)]",
                                "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                                "disabled:opacity-40 disabled:cursor-not-allowed",
                              )}
                            >
                              <span className={cn("block text-[13px] leading-relaxed", isDark ? "text-white" : "text-[var(--text-primary)]")}>
                                {opt.label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (!isThinking) {
                              const base = value.trim() || refinement.original;
                              void runWithOptionalRefinement(base, null);
                            }
                          }}
                          disabled={isThinking}
                          className={cn(
                            "mt-4 w-full py-2.5 text-[14px] font-medium transition-colors rounded-lg",
                            isDark ? "text-white/60 hover:text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                            "disabled:opacity-40",
                          )}
                        >
                          Send original prompt as written →
                        </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agent analyzing / clarifying phase */}
            <AnimatePresence initial={false}>
              {agentPhase && (
                <motion.div
                  key="agent-phase"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "overflow-hidden rounded-t-[20px] border-b",
                    isDark
                      ? "border-white/10 bg-gradient-to-b from-[rgba(28,28,30,0.92)] to-[rgba(28,28,30,0.80)]"
                      : "border-[var(--border)] bg-gradient-to-b from-white/90 to-white/75",
                  )}
                >
                  <div className="px-4 pt-4 pb-4">
                    <AnimatePresence mode="wait">
                      {agentPhase.phase === "analyzing" ? (
                        <motion.div
                          key="agent-analyzing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-5 h-5 flex-shrink-0">
                              <motion.div
                                className={cn("absolute inset-0 rounded-full border-2", isDark ? "border-white/20 border-t-white/70" : "border-neutral-200 border-t-neutral-500")}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                            <div>
                              <p className={cn("text-[14px] font-semibold leading-snug", isDark ? "text-white" : "text-[var(--text-primary)]")}>
                                {initialGenPhase ? "Generating your campaign…" : "Analyzing your prompt…"}
                              </p>
                            </div>
                          </div>
                          <div className="ml-8 space-y-1.5">
                            {(initialGenPhase
                              ? [
                                  "Understanding campaign brief",
                                  "Planning channel strategy",
                                  "Generating email content",
                                  "Generating SMS content",
                                  "Building visual layouts",
                                  "Preparing assets",
                                ]
                              : ["Understanding intent", "Reviewing context", "Planning changes"]
                            ).map((step, i) => (
                              <motion.div
                                key={step}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (initialGenPhase ? 1.0 : 0.5) + i * (initialGenPhase ? 2.2 : 0.9), duration: 0.3 }}
                                className="flex items-center gap-2"
                              >
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: (initialGenPhase ? 1.0 : 0.5) + i * (initialGenPhase ? 2.2 : 0.9) + 0.2, duration: 0.2 }}
                                >
                                  <CheckIcon className="w-3 h-3 text-green-500" />
                                </motion.div>
                                <span className={cn("text-[13px]", isDark ? "text-white/70" : "text-[var(--text-secondary)]")}>{step}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : agentPhase.phase === "clarify" ? (
                        <motion.div
                          key="agent-clarify"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-white/20" : "bg-neutral-900")}>
                              <span className="text-[13px] font-bold text-white">?</span>
                            </div>
                            <p className={cn("text-[14px] font-semibold", isDark ? "text-white" : "text-[var(--text-primary)]")}>
                              {clarifyingQuestions[agentPhase.questionIndex].question}
                            </p>
                          </div>
                          <p className={cn("text-[13px] ml-7", isDark ? "text-white/60" : "text-[var(--text-secondary)]")}>
                            Pick an option to refine the result, or skip to use your prompt as-is.
                          </p>
                          <div className="flex flex-col gap-2 mt-1">
                            {clarifyingQuestions[agentPhase.questionIndex].options.map((opt, i) => (
                              <motion.button
                                key={opt.key}
                                type="button"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  if (!isThinking) {
                                    void executeAgent(agentPhase.prompt, opt.label);
                                  }
                                }}
                                disabled={isThinking}
                                className={cn(
                                  "w-full text-left rounded-xl border px-4 py-3 transition-colors flex items-center gap-3",
                                  isDark
                                    ? "border-white/15 bg-white/[0.08] hover:border-white/25 hover:bg-white/[0.14]"
                                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)]",
                                  "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                                  "disabled:opacity-40 disabled:cursor-not-allowed",
                                )}
                              >
                                <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[13px] font-bold flex-shrink-0", isDark ? "bg-white/[0.12] text-white/60" : "bg-[var(--surface-active)] text-[var(--text-secondary)]")}>
                                  {opt.key}
                                </span>
                                <span className={cn("text-[13px] leading-snug", isDark ? "text-white" : "text-[var(--text-primary)]")}>{opt.label}</span>
                              </motion.button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              if (!isThinking) {
                                void executeAgent(agentPhase.prompt);
                              }
                            }}
                            disabled={isThinking}
                            className={cn(
                              "mt-2 w-full py-2.5 text-[13px] font-medium transition-colors rounded-lg",
                              isDark ? "text-white/60 hover:text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                              "disabled:opacity-40",
                            )}
                          >
                            Skip — send prompt as written →
                          </button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input well — frosted white behind field + quick actions */}
            <div className="px-4 pt-3 pb-3">
              <div className={cn(
                "rounded-xl border px-3 py-2 backdrop-blur-sm",
                isDark
                  ? "border-white/[0.22] bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
              )}>
                <div className="flex items-start gap-0">
                  <AnimatePresence>
                    {selectionPillLabel && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: "auto" }}
                        exit={{ opacity: 0, scale: 0.9, width: 0 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="mr-2 mt-[3px] flex-shrink-0 overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[13px] font-medium whitespace-nowrap text-violet-700">
                          <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                          </svg>
                          <span className="max-w-[180px] truncate">{selectionPillLabel}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask Agentforce…"
                    disabled={isThinking || refinement?.phase === "thinking" || agentPhase?.phase === "analyzing"}
                    rows={1}
                    className={cn(
                      "min-h-[32px] flex-1 min-w-0 resize-none bg-transparent py-1.5",
                      "text-[13px] font-normal leading-relaxed",
                      "text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
                      "focus:outline-none selection:bg-blue-100",
                      "disabled:opacity-60",
                    )}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {!value && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isThinking) return;
                              const prompt = action.prompt(contextLabel);
                              setValue(prompt);
                              inputRef.current?.focus();
                            }}
                            disabled={isThinking}
                            className={cn(
                              "h-8 rounded-lg border px-3 text-[13px] font-medium transition-all",
                              "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-hover)]",
                              "disabled:cursor-not-allowed disabled:opacity-40",
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom toolbar */}
            <div ref={toolbarRef} className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-[var(--border)]">
              {/* Left: Attachments + Brief + Channels + Language */}
              <div className="flex items-center gap-2">
                <AttachmentsMenu variant="light" isNarrow={isNarrow} />
                {!isNarrow && (
                  <>
                    <div className="h-4 w-px mx-1 bg-[var(--border)]" />
                    <BriefMenu variant="light" />
                    <BrandKitMenu variant="light" />
                    <ChannelsMenu variant="light" />
                  </>
                )}
              </div>

              {/* Right: History + Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHistoryClick}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[13px] font-medium transition-all border flex items-center gap-1.5",
                    showContextPanel && agentPanelHistoryOnly
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-hover)]",
                  )}
                  title="Open Agentforce history"
                >
                  <HistoryIcon className="w-3.5 h-3.5 opacity-80" />
                  History
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSubmit();
                  }}
                  disabled={
                    isThinking ||
                    refinement?.phase === "thinking" ||
                    agentPhase?.phase === "analyzing" ||
                    (!refinement && !agentPhase && !value.trim())
                  }
                  className={cn(
                    "w-9 h-9 rounded-full flex-shrink-0",
                    "flex items-center justify-center border backdrop-blur-sm",
                    isDark
                      ? "border-white/[0.22] bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
                    "transition-all duration-200 active:scale-95",
                    !isThinking &&
                      (refinement ? refinement.phase === "ready" : agentPhase?.phase === "clarify" || Boolean(value.trim()))
                      ? isDark ? "text-[var(--text-primary)] hover:bg-white/[0.24]" : "text-[var(--text-primary)] hover:bg-white/70"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {isThinking ? (
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const quickActions: { label: string; prompt: (ctx: string) => string; activity: string; variant?: boolean }[] = [
  {
    label: "Adjust tone",
    prompt: (ctx: string) => `Adjust tone for ${ctx}`,
    activity: "Refining tone…",
  },
  {
    label: "Generate variants",
    prompt: (ctx: string) => `Generate variants for ${ctx}`,
    activity: "Generating variants…",
    variant: true,
  },
];

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

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
