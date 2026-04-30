"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { useGenerationStore } from "@/stores/generation";
import { EmailBlock } from "./EmailBlock";
import { SMSBlock } from "./SMSBlock";
import { WhatsAppBlock } from "./WhatsAppBlock";
import { ContentSkeleton } from "./ContentSkeleton";
import { GeneratingState } from "./GeneratingState";
import { AddBlockButton } from "./AddBlockButton";
import { cn } from "@/lib/cn";

interface CanvasAreaProps {
  className?: string;
}

type ContentPhase = "initializing" | "skeletons" | "populating" | "complete";

export function CanvasArea({ className }: CanvasAreaProps) {
  const { blocks, isGenerating, loadMockContent, setGenerating } = useCanvasStore();
  const { steps } = useGenerationStore();
  const [contentPhase, setContentPhase] = useState<ContentPhase>("initializing");
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>([]);
  const [skeletonChannels, setSkeletonChannels] = useState<Array<"email" | "sms" | "whatsapp">>([]);
  const [completedSkeletons, setCompletedSkeletons] = useState<string[]>([]);

  // Check if channel variants step is complete
  const channelsComplete = steps.find(s => s.id === "channels")?.status === "completed";
  const allStepsComplete = steps.every(s => s.status === "completed");

  useEffect(() => {
    if (blocks.length === 0) {
      setGenerating(true);
      setContentPhase("initializing");
      
      // Phase 1: Show initial generating state
      setTimeout(() => {
        setContentPhase("skeletons");
        // Progressively show skeleton cards
        setTimeout(() => setSkeletonChannels(["email"]), 300);
        setTimeout(() => setSkeletonChannels(["email", "sms"]), 700);
        setTimeout(() => setSkeletonChannels(["email", "sms", "whatsapp"]), 1100);
      }, 2000);
    }
  }, []);

  // When all generation steps complete, load actual content
  useEffect(() => {
    if (allStepsComplete && contentPhase === "skeletons" && blocks.length === 0) {
      // Wait for skeleton animations to complete
      setTimeout(() => {
        setContentPhase("populating");
        loadMockContent();
        setGenerating(false);
      }, 500);
    }
  }, [allStepsComplete, contentPhase, blocks.length]);

  // Progressive reveal of actual blocks
  useEffect(() => {
    if (contentPhase === "populating" && blocks.length > 0 && visibleBlocks.length < blocks.length) {
      const timer = setTimeout(() => {
        const nextBlock = blocks[visibleBlocks.length];
        if (nextBlock) {
          setVisibleBlocks((prev) => [...prev, nextBlock.id]);
        }
        
        if (visibleBlocks.length + 1 === blocks.length) {
          setContentPhase("complete");
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [blocks, visibleBlocks, contentPhase]);

  const handleSkeletonComplete = useCallback((channel: string) => {
    setCompletedSkeletons(prev => [...prev, channel]);
  }, []);

  const handleAddBlock = () => {
    console.log("Add block clicked");
  };

  const renderBlock = (block: typeof blocks[0], index: number) => {
    const isVisible = visibleBlocks.includes(block.id);
    
    if (!isVisible) {
      return (
        <ContentSkeleton 
          key={`skeleton-${block.channel}-${index}`}
          channel={block.channel}
          delay={index * 200}
        />
      );
    }

    const BlockComponent = {
      email: EmailBlock,
      sms: SMSBlock,
      whatsapp: WhatsAppBlock,
    }[block.channel];

    return (
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.1
        }}
      >
        <BlockComponent block={block} />
      </motion.div>
    );
  };

  return (
    <div className={cn("max-w-4xl mx-auto px-6 py-12", className)}>
      <AnimatePresence mode="wait">
        {contentPhase === "initializing" ? (
          <GeneratingState key="generating" />
        ) : contentPhase === "skeletons" ? (
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-2"
            >
              <div>
                <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Channel Variants</h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Composing content for each channel</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
                <span className="text-[13px] text-[var(--text-muted)]">
                  {skeletonChannels.length} of 3 channels
                </span>
              </div>
            </motion.div>

            {/* Skeleton cards */}
            <AnimatePresence>
              {skeletonChannels.map((channel, i) => (
                <ContentSkeleton
                  key={`skeleton-${channel}`}
                  channel={channel}
                  delay={0}
                  onComplete={() => handleSkeletonComplete(channel)}
                />
              ))}
            </AnimatePresence>

            {/* Building indicators */}
            {skeletonChannels.length === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4 py-4"
              >
                <BuildingIndicator 
                  label="Personalization" 
                  isActive={steps.find(s => s.id === "personalization")?.status === "in_progress"}
                  isComplete={steps.find(s => s.id === "personalization")?.status === "completed"}
                />
                <BuildingIndicator 
                  label="Languages" 
                  isActive={steps.find(s => s.id === "language")?.status === "in_progress"}
                  isComplete={steps.find(s => s.id === "language")?.status === "completed"}
                />
                <BuildingIndicator 
                  label="Compliance" 
                  isActive={steps.find(s => s.id === "compliance")?.status === "in_progress"}
                  isComplete={steps.find(s => s.id === "compliance")?.status === "completed"}
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Completion header */}
            {contentPhase === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-medium text-emerald-900">Content generated</h3>
                    <p className="text-[13px] text-emerald-700">
                      {blocks.length} variants · 82% brand alignment · Ready for review
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[13px] font-medium">
                    3 languages
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[13px] font-medium">
                    Personalized
                  </span>
                </div>
              </motion.div>
            )}

            {blocks.map((block, index) => renderBlock(block, index))}
            
            {contentPhase === "complete" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AddBlockButton onClick={handleAddBlock} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BuildingIndicatorProps {
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

function BuildingIndicator({ label, isActive, isComplete }: BuildingIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {isComplete ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center"
        >
          <CheckIcon className="w-2.5 h-2.5 text-emerald-600" />
        </motion.div>
      ) : isActive ? (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </motion.div>
      ) : (
        <div className="w-4 h-4 rounded-full bg-[var(--surface-active)]" />
      )}
      <span className={cn(
        "text-[13px] transition-colors",
        isComplete ? "text-emerald-600" : isActive ? "text-blue-600" : "text-[var(--text-muted)]"
      )}>
        {label}
      </span>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
