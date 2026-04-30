"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useProjectsStore } from "@/stores/projects";
import { useComposerStore } from "@/stores/composer";
import { useCampaignCreationStore } from "@/stores/campaign-creation";
import { cn } from "@/lib/cn";

export type ComposerVariant = "dark" | "light" | "glass";

interface CampaignComposerProps {
  variant?: ComposerVariant;
  placeholder?: string;
  className?: string;
  showExamples?: boolean;
}

type ClarificationPhase = 
  | null
  | { step: "thinking" }
  | { step: "tone"; selected: string | null }
  | { step: "objective"; selected: string | null }
  | { step: "audience"; selected: string | null }
  | { step: "ready"; tone: string; objective: string; audience: string };

const THINKING_DELAY = 1200;

const toneOptions = [
  { id: "professional", label: "Professional", description: "Formal and business-appropriate" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable" },
  { id: "urgent", label: "Urgent", description: "Time-sensitive and action-oriented" },
  { id: "inspiring", label: "Inspiring", description: "Motivational and uplifting" },
];

const objectiveOptions = [
  { id: "awareness", label: "Build Awareness", description: "Introduce product/service" },
  { id: "conversion", label: "Drive Conversions", description: "Generate sales or signups" },
  { id: "engagement", label: "Increase Engagement", description: "Boost interactions" },
  { id: "retention", label: "Retain Customers", description: "Keep existing customers" },
];

const audienceOptions = [
  { id: "new", label: "New Prospects", description: "First-time contacts" },
  { id: "existing", label: "Existing Customers", description: "Current customer base" },
  { id: "lapsed", label: "Lapsed Customers", description: "Win-back targets" },
  { id: "vip", label: "VIP Segment", description: "High-value customers" },
];

export function CampaignComposer({ 
  variant = "glass", 
  placeholder = "Describe your campaign idea...",
  className,
}: CampaignComposerProps) {
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { currentPrompt, setPrompt } = useProjectsStore();
  const composerState = useComposerStore();
  const { attachments, tokens, addAttachment, addToken, removeAttachment, removeToken } = composerState;
  const { startCreation, isCreating } = useCampaignCreationStore();
  
  const [isFocused, setIsFocused] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [clarification, setClarification] = useState<ClarificationPhase>(null);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const hasContext = attachments.length > 0 || tokens.length > 0;

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddMenu]);

  // Handle escape to dismiss clarification
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && clarification) {
        setClarification(null);
        setSelectedTone(null);
        setSelectedObjective(null);
        setSelectedAudience(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [clarification]);

  const runCreation = useCallback(async (finalPrompt: string) => {
    if (!isAuthenticated) {
      openLoginModal(finalPrompt);
      return;
    }
    try {
      await startCreation(finalPrompt, composerState);
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  }, [isAuthenticated, openLoginModal, startCreation, composerState]);

  const startClarification = useCallback(() => {
    setClarification({ step: "thinking" });
    setTimeout(() => {
      setClarification({ step: "tone", selected: null });
    }, THINKING_DELAY);
  }, []);

  const handleToneSelect = (toneId: string) => {
    setSelectedTone(toneId);
    setClarification({ step: "objective", selected: null });
  };

  const handleObjectiveSelect = (objectiveId: string) => {
    setSelectedObjective(objectiveId);
    setClarification({ step: "audience", selected: null });
  };

  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
    // Now generate
    const tone = toneOptions.find(t => t.id === selectedTone)?.label || "";
    const objective = objectiveOptions.find(o => o.id === selectedObjective)?.label || "";
    const audience = audienceOptions.find(a => a.id === audienceId)?.label || "";
    
    const enrichedPrompt = `${currentPrompt.trim()}

[Agent Context]
- Tone: ${tone}
- Objective: ${objective}
- Audience: ${audience}`;
    
    setClarification(null);
    setSelectedTone(null);
    setSelectedObjective(null);
    setSelectedAudience(null);
    runCreation(enrichedPrompt);
  };

  const handleSkipClarification = () => {
    setClarification(null);
    setSelectedTone(null);
    setSelectedObjective(null);
    setSelectedAudience(null);
    runCreation(currentPrompt.trim());
  };

  const handleSubmit = async () => {
    if (isCreating) return;
    const p = currentPrompt.trim();
    if (!p) return;

    if (!isAuthenticated) {
      openLoginModal(p);
      return;
    }

    // Start clarification flow
    startClarification();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "BUTTON" && !target.closest("button") && !target.closest("[data-menu]")) {
      textareaRef.current?.focus();
    }
  };

  // Add menu handlers
  const handleAddBrief = () => {
    addAttachment({
      id: `brief-${Date.now()}`,
      name: "Campaign Brief.pdf",
      type: "pdf",
      source: "upload",
      size: "2.4 MB"
    });
    setShowAddMenu(false);
  };

  const handleAddAssets = () => {
    addAttachment({
      id: `asset-${Date.now()}`,
      name: "Product Images",
      type: "image",
      source: "salesforce",
    });
    setShowAddMenu(false);
  };

  const handleAddBrandKit = () => {
    addToken({
      id: `brand-${Date.now()}`,
      type: "brand",
      label: "NTO Brand Kit",
      data: { brandId: "nto-brand" }
    });
    setShowAddMenu(false);
  };

  const handleAddAudience = () => {
    addToken({
      id: `audience-${Date.now()}`,
      type: "audience",
      label: "Spring Shoppers",
      data: { segmentId: "spring-shoppers-segment" }
    });
    setShowAddMenu(false);
  };

  const isGlass = variant === "glass";

  return (
    <div className={cn("w-full", className)}>
      {/* Main Input Container */}
      <div
        onClick={handleContainerClick}
        className={cn(
          "relative rounded bg-[var(--surface)] transition-all duration-150",
          isGlass 
            ? "border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.12)]" 
            : "border border-[var(--border)]",
          isFocused && (isGlass 
            ? "border-white/50 shadow-[0_4px_32px_rgba(0,0,0,0.16)]" 
            : "border-[#0F8EFF] shadow-[0_0_0_1px_#0F8EFF]")
        )}
      >
        {/* Clarification Panel */}
        <AnimatePresence>
          {clarification && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-[#E5E5E5] bg-[#FAFAFA]"
            >
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {clarification.step === "thinking" ? (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-[#EBF5FE] flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <SparkleIcon className="w-4 h-4 text-[#0F8EFF]" />
                        </motion.div>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">
                          Understanding your request...
                        </p>
                        <p className="text-[13px] text-[var(--text-muted)]">
                          Preparing a few quick questions to help create the perfect campaign
                        </p>
                      </div>
                    </motion.div>
                  ) : clarification.step === "tone" ? (
                    <ClarificationStep
                      key="tone"
                      icon={<ToneIcon className="w-4 h-4 text-[#0F8EFF]" />}
                      question="What tone should the campaign have?"
                      options={toneOptions}
                      onSelect={handleToneSelect}
                      onSkip={handleSkipClarification}
                      stepNumber={1}
                      totalSteps={3}
                    />
                  ) : clarification.step === "objective" ? (
                    <ClarificationStep
                      key="objective"
                      icon={<TargetIcon className="w-4 h-4 text-[#0F8EFF]" />}
                      question="What's the main objective?"
                      options={objectiveOptions}
                      onSelect={handleObjectiveSelect}
                      onSkip={handleSkipClarification}
                      stepNumber={2}
                      totalSteps={3}
                    />
                  ) : clarification.step === "audience" ? (
                    <ClarificationStep
                      key="audience"
                      icon={<AudienceIcon className="w-4 h-4 text-[#0F8EFF]" />}
                      question="Who is the target audience?"
                      options={audienceOptions}
                      onSelect={handleAudienceSelect}
                      onSkip={handleSkipClarification}
                      stepNumber={3}
                      totalSteps={3}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-start">
          {/* Add Button */}
          <div className="relative p-3" ref={addMenuRef} data-menu>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(!showAddMenu);
              }}
              className={cn(
                "w-8 h-8 rounded flex items-center justify-center transition-colors",
                showAddMenu 
                  ? "bg-[#0F8EFF] text-white" 
                  : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[#E5E5E5] hover:text-[var(--text-primary)]"
              )}
              title="Add context"
            >
              <PlusIcon className="w-4 h-4" />
            </button>

            {/* Add Menu Dropdown */}
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-3 top-full mt-1 z-50 w-56 bg-[var(--surface)] border border-[var(--border)] rounded shadow-[0_2px_8px_rgba(0,0,0,0.16)]"
                >
                  <div className="p-1">
                    <AddMenuItem
                      icon={<DocumentIcon className="w-4 h-4" />}
                      label="Add Brief"
                      description="PDF or document"
                      onClick={handleAddBrief}
                    />
                    <AddMenuItem
                      icon={<ImageIcon className="w-4 h-4" />}
                      label="Add Assets"
                      description="Images and media"
                      onClick={handleAddAssets}
                    />
                    <AddMenuItem
                      icon={<BrandIcon className="w-4 h-4" />}
                      label="Add Brand Kit"
                      description="Colors, fonts, logo"
                      onClick={handleAddBrandKit}
                    />
                    <AddMenuItem
                      icon={<AudienceIcon className="w-4 h-4" />}
                      label="Add Audience"
                      description="Target segment"
                      onClick={handleAddAudience}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          <div className="flex-1 py-3 pr-3">
            {/* Context Chips */}
            <AnimatePresence>
              {hasContext && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 mb-2"
                >
                  {tokens.map((token) => (
                    <ContextChip
                      key={token.id}
                      icon={token.type === "brand" ? <BrandIcon className="w-3 h-3" /> : <AudienceIcon className="w-3 h-3" />}
                      label={token.label}
                      onRemove={() => removeToken(token.id)}
                    />
                  ))}
                  {attachments.map((attachment) => (
                    <ContextChip
                      key={attachment.id}
                      icon={attachment.type === "pdf" ? <DocumentIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      label={attachment.name}
                      onRemove={() => removeAttachment(attachment.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isCreating || clarification?.step === "thinking"}
              rows={2}
              className={cn(
                "w-full bg-transparent resize-none",
                "text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none disabled:opacity-60"
              )}
            />
          </div>

          {/* Send Button */}
          <div className="p-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              disabled={isCreating || !currentPrompt.trim() || clarification?.step === "thinking"}
              className={cn(
                "w-8 h-8 rounded flex items-center justify-center transition-all",
                currentPrompt.trim() && !isCreating
                  ? "bg-[#0F8EFF] text-white hover:bg-[#014486]"
                  : "bg-[var(--background)] text-[var(--text-muted)]"
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
                <ArrowUpIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-center text-[13px] mt-3 text-white/60">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[13px] mx-0.5">↵</kbd> to continue
      </p>
    </div>
  );
}

// Clarification Step Component
interface ClarificationStepProps {
  icon: React.ReactNode;
  question: string;
  options: { id: string; label: string; description: string }[];
  onSelect: (id: string) => void;
  onSkip: () => void;
  stepNumber: number;
  totalSteps: number;
}

function ClarificationStep({ icon, question, options, onSelect, onSkip, stepNumber, totalSteps }: ClarificationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#EBF5FE] flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[13px] font-bold text-[var(--text-primary)]">{question}</span>
        </div>
        <span className="text-[13px] text-[var(--text-muted)]">
          Step {stepNumber} of {totalSteps}
        </span>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="text-left p-3 rounded border border-[var(--border)] bg-[var(--surface)] hover:border-[#0F8EFF] hover:bg-[#F7FBFE] transition-colors"
          >
            <p className="text-[13px] font-bold text-[var(--text-primary)]">{option.label}</p>
            <p className="text-[13px] text-[var(--text-muted)]">{option.description}</p>
          </button>
        ))}
      </div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={onSkip}
        className="text-[13px] text-[var(--text-muted)] hover:text-[#0F8EFF] transition-colors"
      >
        Skip and generate now →
      </button>
    </motion.div>
  );
}

// Add Menu Item Component
interface AddMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function AddMenuItem({ icon, label, description, onClick }: AddMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[var(--background)] transition-colors text-left"
    >
      <div className="w-8 h-8 rounded bg-[#EBF5FE] flex items-center justify-center text-[#0F8EFF]">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
        <p className="text-[13px] text-[var(--text-muted)]">{description}</p>
      </div>
    </button>
  );
}

// Context Chip Component
interface ContextChipProps {
  icon: React.ReactNode;
  label: string;
  onRemove: () => void;
}

function ContextChip({ icon, label, onRemove }: ContextChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#EBF5FE] border border-[#B4D6F4]"
    >
      <span className="text-[#0F8EFF]">{icon}</span>
      <span className="text-[13px] font-bold text-[#0F8EFF] max-w-[120px] truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-4 h-4 rounded flex items-center justify-center text-[#0F8EFF] hover:bg-[#0F8EFF] hover:text-white transition-colors"
      >
        <CloseIcon className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
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

function ToneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
