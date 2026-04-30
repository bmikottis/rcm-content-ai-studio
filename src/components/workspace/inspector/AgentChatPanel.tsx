"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationStore } from "@/stores/conversation";
import { cn } from "@/lib/cn";

export function AgentChatPanel() {
  const { messages, sendPrompt, isThinking } = useConversationStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const p = input.trim();
    if (!p || isThinking) return;
    setInput("");
    await sendPrompt(p);
  }, [input, isThinking, sendPrompt]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestions = [
    "Adjust tone",
    "Make it shorter",
    "Add variants",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-neutral-900 text-white"
                    : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]",
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl px-3 py-2 flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </motion.div>
        )}

        {/* Suggestion chips when conversation is short */}
        {messages.length <= 1 && !isThinking && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--border)] p-2">
        <div className="flex items-end gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything…"
            disabled={isThinking}
            rows={1}
            className={cn(
              "flex-1 min-w-0 resize-none bg-transparent text-[13px] leading-relaxed",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "disabled:opacity-50",
              "min-h-[24px] max-h-[72px]",
            )}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isThinking}
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
              input.trim() && !isThinking
                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-[var(--surface-active)] text-neutral-300",
            )}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
