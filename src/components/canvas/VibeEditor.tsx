"use client";

import { useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { useVibeEditStore } from "@/stores/vibe-edit";
import { applyVibeTransformation } from "@/data/vibe-transformations";
import { FloatingVibeInput } from "./FloatingVibeInput";
import { DiffView } from "./DiffView";
import { BrandWarning } from "./BrandWarning";
import { ContentBlock } from "@/types/canvas";
import { cn } from "@/lib/cn";

interface VibeEditorProps {
  className?: string;
}

export function VibeEditor({ className }: VibeEditorProps) {
  const { blocks, updateBlock, selectedBlockId } = useCanvasStore();
  const {
    isEditing,
    isRegenerating,
    originalContent,
    updatedContent,
    showDiff,
    setEditing,
    setRegenerating,
    setOriginalContent,
    setUpdatedContent,
    setShowDiff,
    acceptChanges,
    revertChanges,
    cancelEdit,
  } = useVibeEditStore();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelEdit();
      }
    };

    if (isEditing) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing, cancelEdit]);

  const handleVibeSubmit = useCallback(
    async (vibe: string) => {
      if (!selectedBlock) return;

      // Store original
      setOriginalContent(selectedBlock);
      setRegenerating(true);

      // Simulate regeneration delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Apply transformation
      const { newText: newBody, brandComplianceChange } = applyVibeTransformation(
        selectedBlock.body,
        vibe
      );

      const { newText: newHeadline } = applyVibeTransformation(
        selectedBlock.headline,
        vibe
      );

      const updated: ContentBlock = {
        ...selectedBlock,
        body: newBody,
        headline: newHeadline,
        brandCompliance: Math.max(
          0,
          Math.min(100, selectedBlock.brandCompliance + brandComplianceChange)
        ),
        generatedAt: new Date(),
      };

      setUpdatedContent(updated);
      setRegenerating(false);
      setShowDiff(true);
    },
    [selectedBlock, setOriginalContent, setRegenerating, setUpdatedContent, setShowDiff]
  );

  const handleAccept = useCallback(() => {
    if (updatedContent) {
      updateBlock(updatedContent.id, updatedContent);
    }
    acceptChanges();
  }, [updatedContent, updateBlock, acceptChanges]);

  const handleRevert = useCallback(() => {
    revertChanges();
  }, [revertChanges]);

  const handleCancel = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  const showWarning = updatedContent && updatedContent.brandCompliance < 70;

  if (!selectedBlockId || !selectedBlock) return null;

  return (
    <div className={cn("fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4", className)}>
      <AnimatePresence mode="wait">
        {isEditing && !showDiff && !isRegenerating && (
          <FloatingVibeInput
            key="input"
            onSubmit={handleVibeSubmit}
            onCancel={handleCancel}
          />
        )}

        {isRegenerating && (
          <div
            key="loading"
            className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-md)] p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin">◯</span>
              <span className="text-body text-[var(--text-secondary)]">
                Updating...
              </span>
            </div>
          </div>
        )}

        {showDiff && originalContent && updatedContent && !showWarning && (
          <div
            key="diff"
            className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-md)] p-6"
          >
            <DiffView
              original={originalContent}
              updated={updatedContent}
              onAccept={handleAccept}
              onRevert={handleRevert}
            />
          </div>
        )}

        {showWarning && updatedContent && (
          <BrandWarning
            key="warning"
            complianceScore={updatedContent.brandCompliance}
            onApply={handleAccept}
            onAdjust={handleRevert}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
