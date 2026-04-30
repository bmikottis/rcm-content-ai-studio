"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { GenerationLog } from "@/components/generation";
import { cn } from "@/lib/cn";

interface AgentPanelProps {
  className?: string;
}

type PanelView = "generation" | "chat";

export function AgentPanel({ className }: AgentPanelProps) {
  const { agentMessages, sendAgentMessage, blocks, isGenerating } = useCanvasStore();
  const [activeView, setActiveView] = useState<PanelView>("generation");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agentMessages]);

  const handleSend = () => {
    if (input.trim()) {
      sendAgentMessage(input.trim());
      setInput("");
      setActiveView("chat");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickJumps = blocks.map((b) => ({
    id: b.id,
    label: b.channel === "email" ? `Email ${b.variant || ""}`.trim() : b.channel.toUpperCase(),
  }));

  return (
    <div className={cn("flex flex-col h-full bg-[#09090B]", className)}>
      {/* View tabs */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.04]">
          <button
            onClick={() => setActiveView("generation")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
              activeView === "generation" 
                ? "bg-white/[0.08] text-white" 
                : "text-white/35 hover:text-white/50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <SparklesIcon className="w-3.5 h-3.5" />
              Generation
            </span>
          </button>
          <button
            onClick={() => setActiveView("chat")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
              activeView === "chat" 
                ? "bg-white/[0.08] text-white" 
                : "text-white/35 hover:text-white/50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <ChatIcon className="w-3.5 h-3.5" />
              Edit
              {agentMessages.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A1E0]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === "generation" ? (
            <motion.div
              key="generation"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <GenerationLog />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full flex flex-col"
            >
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {agentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-5">
                      <EditIcon className="w-6 h-6 text-white/15" />
                    </div>
                    <p className="text-[13px] text-white/50 font-bold mb-2">Edit your content</p>
                    <p className="text-[13px] text-white/25 leading-relaxed">
                      Select any content block and ask for changes, or type below to refine the entire campaign.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {agentMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn("flex gap-3", msg.type === "user" && "flex-row-reverse")}
                      >
                        {msg.type === "agent" && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A1E0] to-[#0078A8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00A1E0]/20">
                            <BotIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed",
                            msg.type === "agent"
                              ? "bg-white/[0.04] text-white/80 border border-white/[0.05]"
                              : "bg-[#00A1E0] text-white"
                          )}
                        >
                          {msg.content}
                          
                          {msg.contentRefs && msg.contentRefs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {quickJumps.map((jump) => (
                                <button
                                  key={jump.id}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/60 text-[13px] font-medium hover:bg-white/[0.1] transition-colors"
                                >
                                  {jump.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="flex-shrink-0 p-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Make it more premium..."
                    className={cn(
                      "flex-1 h-11 px-4 bg-white/[0.03] rounded-xl",
                      "border border-white/[0.05] text-white text-[13px]",
                      "placeholder:text-white/25",
                      "focus:outline-none focus:border-white/15 focus:bg-white/[0.05]",
                      "transition-all duration-200"
                    )}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={cn(
                      "w-11 h-11 rounded-xl",
                      "flex items-center justify-center",
                      "transition-all duration-200",
                      input.trim()
                        ? "bg-[#00A1E0] text-white hover:bg-[#0090C8] shadow-lg shadow-[#00A1E0]/20"
                        : "bg-white/[0.03] text-white/15"
                    )}
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
