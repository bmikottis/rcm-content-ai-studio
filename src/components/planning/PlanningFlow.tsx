"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanningStore } from "@/stores/planning";
import { useContextStore } from "@/stores/context";
import { analyzePrompt, generateSteps, buildSummary } from "@/lib/planning-logic";
import { UserPrompt } from "./UserPrompt";
import { AgentMessage } from "./AgentMessage";
import { TypingIndicator } from "./TypingIndicator";
import { QuestionInput } from "./QuestionInput";
import { ChipSelect } from "./ChipSelect";
import { SummaryCard } from "./SummaryCard";
import { cn } from "@/lib/cn";

interface PlanningFlowProps {
  initialPrompt: string;
  className?: string;
}

export function PlanningFlow({ initialPrompt, className }: PlanningFlowProps) {
  const router = useRouter();
  const { context } = useContextStore();
  const {
    steps,
    currentStepIndex,
    answers,
    summary,
    isGenerating,
    isThinking,
    setPrompt,
    setSteps,
    submitAnswer,
    nextStep,
    previousStep,
    setSummary,
    setGenerating,
    setThinking,
  } = usePlanningStore();

  // Initialize on mount
  useEffect(() => {
    setPrompt(initialPrompt);
    const analysis = analyzePrompt(initialPrompt);
    const generatedSteps = generateSteps(initialPrompt, context, analysis);
    setSteps(generatedSteps);
    
    // Show typing indicator briefly
    setThinking(true);
    setTimeout(() => setThinking(false), 800);
  }, [initialPrompt, context, setPrompt, setSteps, setThinking]);

  const currentStep = steps[currentStepIndex];
  const completedSteps = steps.filter((s) => s.isComplete);
  const isSummaryStep = currentStep?.type === "summary";

  // Build summary when reaching summary step
  useEffect(() => {
    if (isSummaryStep && !summary) {
      const builtSummary = buildSummary(initialPrompt, context, answers);
      setSummary(builtSummary);
    }
  }, [isSummaryStep, summary, initialPrompt, context, answers, setSummary]);

  const handleAnswerSubmit = (answer: string | string[]) => {
    if (!currentStep) return;
    
    submitAnswer(currentStep.id, answer);
    
    // Show typing indicator before next step
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      nextStep();
    }, 500);
  };

  const handleEdit = () => {
    // Go back to first question
    usePlanningStore.setState({ currentStepIndex: completedSteps.length > 0 ? 1 : 0 });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Navigate to canvas with new project (opens in new tab)
    const projectId = `proj-${Date.now()}`;
    window.open(`/projects/${projectId}`, '_blank');
  };

  return (
    <div className={cn("max-w-2xl mx-auto space-y-6", className)}>
      {/* Original prompt */}
      <UserPrompt prompt={initialPrompt} />

      {/* Completed steps */}
      <AnimatePresence mode="sync">
        {completedSteps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <AgentMessage>
              <p className="text-body text-[var(--text-primary)]">{step.content}</p>
              {step.answer && (
                <div className="mt-3 px-4 py-2 bg-[var(--background)] rounded-[var(--radius-md)] inline-block">
                  <span className="text-body-sm text-[var(--text-secondary)]">
                    {Array.isArray(step.answer) ? step.answer.join(", ") : step.answer}
                  </span>
                </div>
              )}
            </AgentMessage>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AgentMessage>
              <TypingIndicator />
            </AgentMessage>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current step */}
      <AnimatePresence mode="wait">
        {!isThinking && currentStep && !currentStep.isComplete && (
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep.type === "question" && (
              <AgentMessage>
                <p className="text-body text-[var(--text-primary)]">
                  {currentStep.content}
                </p>
                
                {currentStep.inputType === "text" && (
                  <QuestionInput onSubmit={handleAnswerSubmit} />
                )}
                
                {currentStep.inputType === "single-select" && currentStep.options && (
                  <ChipSelect
                    options={currentStep.options}
                    multi={false}
                    onSubmit={handleAnswerSubmit}
                  />
                )}
                
                {currentStep.inputType === "multi-select" && currentStep.options && (
                  <ChipSelect
                    options={currentStep.options}
                    multi={true}
                    onSubmit={handleAnswerSubmit}
                  />
                )}
              </AgentMessage>
            )}

            {currentStep.type === "summary" && summary && (
              <AgentMessage>
                <SummaryCard
                  summary={summary}
                  onEdit={handleEdit}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </AgentMessage>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
