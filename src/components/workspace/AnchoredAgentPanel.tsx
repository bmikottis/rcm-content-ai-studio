"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationStore, type ChatMessage } from "@/stores/conversation";
import { useToolsStore } from "@/stores/tools";
import { cn } from "@/lib/cn";

export function AnchoredAgentPanel() {
  const { showContextPanel, agentPanelHistoryOnly, closeAgentPanel } = useToolsStore();

  return (
    <AnimatePresence initial={false}>
      {showContextPanel && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex-shrink-0 overflow-hidden border-l border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="absolute inset-0 flex flex-col w-[360px]">
            {/* Header */}
            <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[var(--surface-active)] flex items-center justify-center">
                  <SparkleIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </div>
                <span className="text-[13px] font-bold text-[var(--text-primary)]">
                  {agentPanelHistoryOnly ? "Agentforce History" : "Agentforce"}
                </span>
              </div>
              <button
                type="button"
                onClick={closeAgentPanel}
                className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-neutral-800"
                aria-label="Close panel"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {agentPanelHistoryOnly ? (
              <ChatBody historyOnly />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ChatBody historyOnly={false} />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatBody({ historyOnly }: { historyOnly: boolean }) {
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
    if (!historyOnly) {
      inputRef.current?.focus();
    }
  }, [historyOnly]);

  const handleSubmit = useCallback(async () => {
    const p = input.trim();
    if (!p || isThinking) return;
    setInput("");
    await sendPrompt(p);
  }, [input, isThinking, sendPrompt]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const suggestions = [
    { label: "Adjust tone across channels", icon: "✦" },
    { label: "Make copy shorter", icon: "✂" },
    { label: "Generate new variants", icon: "⊕" },
  ];

  const hasConversation = messages.length > 1;
  const userPromptCount = messages.filter((m) => m.role === "user").length;

  if (historyOnly) {
    return (
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        {userPromptCount === 0 && !isThinking ? (
          <div className="px-4 py-10 text-center">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-active)] flex items-center justify-center mx-auto mb-3">
              <SparkleIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <p className="text-[13px] font-bold text-[var(--text-primary)] mb-1">No prompts yet</p>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              Use <span className="font-bold text-[var(--text-primary)]">Ask Agentforce</span> below to start — your conversation will appear here.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <MessageList messages={messages} isThinking={isThinking} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        {!hasConversation && !isThinking ? (
          <div className="px-4 pt-6">
            <p className="text-[13px] font-bold text-[var(--text-primary)]">Hello,</p>
            <p className="text-[13px] font-bold text-[var(--text-primary)] mt-0.5">
              How can I help you today?
            </p>

            <div className="flex flex-col gap-2 mt-6">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={async () => {
                    await sendPrompt(s.label);
                  }}
                  className="flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-primary)] hover:border-neutral-400 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className="text-[14px] opacity-50">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <MessageList messages={messages} isThinking={isThinking} />
          </div>
        )}
      </div>

      {/* SLDS2 input area */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-[var(--border)]">
        <div className="flex items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 focus-within:border-neutral-400 focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.06)]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Agentforce..."
            disabled={isThinking}
            rows={1}
            className={cn(
              "flex-1 min-w-0 resize-none bg-transparent text-[13px] leading-relaxed",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none disabled:opacity-50",
              "min-h-[24px] max-h-[100px]",
            )}
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!input.trim() || isThinking}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
              input.trim() && !isThinking
                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-[var(--surface-active)] text-[var(--text-muted)]",
            )}
            aria-label="Send"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function MessageList({
  messages,
  isThinking,
}: {
  messages: ChatMessage[];
  isThinking: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPrompt = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedId(id);
        window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <>
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-lg bg-[var(--surface-active)] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <SparkleIcon className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
            )}
            {msg.role === "user" ? (
              <div className="max-w-[85%] min-w-0 flex flex-col items-end gap-0.5">
                <button
                  type="button"
                  onClick={() => void copyPrompt(msg.id, msg.content)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[13px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
                  title="Copy prompt"
                  aria-label="Copy this prompt"
                >
                  {copiedId === msg.id ? (
                    <span className="text-[var(--text-primary)]">Copied</span>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3 opacity-70" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <div className="rounded-lg bg-[var(--surface-active)] text-[var(--text-primary)] px-3 py-2 text-[13px] leading-relaxed w-full text-left">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="max-w-[85%] min-w-0 text-[13px] leading-relaxed text-[var(--text-primary)]">{msg.content}</div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isThinking && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
          <div className="w-6 h-6 rounded-lg bg-[var(--surface-active)] flex items-center justify-center flex-shrink-0 mr-2">
            <SparkleIcon className="w-3 h-3 text-[var(--text-secondary)]" />
          </div>
          <div className="flex items-center gap-1 pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:300ms]" />
          </div>
        </motion.div>
      )}
    </>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
