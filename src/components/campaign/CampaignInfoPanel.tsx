"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GeneratedCampaign } from "@/types/campaign";
import { GLOBAL_HEADER_HEIGHT } from "@/components/layout/GlobalHeader";
import { cn } from "@/lib/cn";

interface CampaignInfoPanelProps {
  campaign: GeneratedCampaign;
}

export function CampaignInfoPanel({ campaign }: CampaignInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "content">("plan");

  return (
    <>
      {/* Collapsed button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setIsExpanded(true)}
            style={{ top: GLOBAL_HEADER_HEIGHT + 64 }}
            className={cn(
              "fixed right-4 z-40",
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "bg-[var(--surface)] border border-[var(--border)] shadow-lg",
              "text-[13px] font-medium text-[var(--text-secondary)]",
              "hover:bg-[var(--surface-hover)] transition-colors"
            )}
          >
            <SparklesIcon className="w-4 h-4 text-[#00A1E0]" />
            Campaign Details
            <ChevronLeftIcon className="w-3 h-3 text-[var(--text-muted)]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ top: GLOBAL_HEADER_HEIGHT }}
            className="fixed right-0 bottom-0 w-[360px] bg-[var(--surface)] border-l border-[var(--border)] z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#00A1E0]" />
                <span className="text-heading-small text-[var(--text-primary)]">
                  Campaign Details
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-active)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-5 py-3 border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTab("plan")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                  activeTab === "plan"
                    ? "bg-neutral-900 text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-active)]"
                )}
              >
                Strategy
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                  activeTab === "content"
                    ? "bg-neutral-900 text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-active)]"
                )}
              >
                Content
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "plan" ? (
                <PlanTab campaign={campaign} />
              ) : (
                <ContentTab campaign={campaign} />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                <ClockIcon className="w-3 h-3" />
                Generated {new Date(campaign.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PlanTab({ campaign }: { campaign: GeneratedCampaign }) {
  const { plan } = campaign;

  return (
    <div className="p-5 space-y-5">
      {/* Objective */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Objective
        </h4>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {plan.objective}
        </p>
      </div>

      {/* Target Audience */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Target Audience
        </h4>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {plan.targetAudience}
        </p>
      </div>

      {/* Key Message */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Key Message
        </h4>
        <p className="text-[14px] text-[var(--text-primary)] font-medium italic leading-relaxed">
          "{plan.keyMessage}"
        </p>
      </div>

      {/* Tone */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Tone & Style
        </h4>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {plan.tone}
        </p>
      </div>

      {/* Channels */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Channels
        </h4>
        <div className="flex flex-wrap gap-2">
          {plan.channels.map((channel) => (
            <span
              key={channel}
              className="px-2.5 py-1 rounded-lg bg-[#00A1E0]/10 text-[#00A1E0] text-[13px] font-medium capitalize"
            >
              {channel}
            </span>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Content Strategy
        </h4>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {plan.contentStrategy}
        </p>
      </div>

      {/* Context used */}
      {campaign.context && (
        <div>
          <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Context Applied
          </h4>
          <div className="space-y-2">
            {campaign.context.brand && (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[var(--text-secondary)]">Brand:</span>
                <span className="text-[var(--text-secondary)] font-medium">{campaign.context.brand}</span>
              </div>
            )}
            {campaign.context.audience && (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[var(--text-secondary)]">Audience:</span>
                <span className="text-[var(--text-secondary)] font-medium">{campaign.context.audience}</span>
              </div>
            )}
            {campaign.context.designStyle && (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[var(--text-secondary)]">Style:</span>
                <span className="text-[var(--text-secondary)] font-medium">{campaign.context.designStyle.name}</span>
              </div>
            )}
            {campaign.context.palette && (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[var(--text-secondary)]">Palette:</span>
                <div className="flex items-center gap-1">
                  {campaign.context.palette.colors.slice(0, 4).map((color, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-sm border border-[var(--border)]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
            {campaign.context.skills.length > 0 && (
              <div className="flex items-start gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                <span className="text-[var(--text-secondary)]">Skills:</span>
                <span className="text-[var(--text-secondary)] font-medium">
                  {campaign.context.skills.map(s => s.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assumptions */}
      {plan.assumptions && plan.assumptions.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Assumptions
          </h4>
          <ul className="space-y-1.5">
            {plan.assumptions.map((assumption, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)] mt-0.5">•</span>
                {assumption}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContentTab({ campaign }: { campaign: GeneratedCampaign }) {
  const [expandedChannel, setExpandedChannel] = useState<string | null>(
    campaign.content[0]?.channel || null
  );

  return (
    <div className="p-5 space-y-3">
      {campaign.content.map((content) => (
        <div
          key={content.channel}
          className="rounded-xl border border-[var(--border)] overflow-hidden"
        >
          <button
            onClick={() => setExpandedChannel(
              expandedChannel === content.channel ? null : content.channel
            )}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChannelIcon channel={content.channel} />
              <span className="text-[13px] font-medium text-[var(--text-primary)] capitalize">
                {content.channel}
              </span>
            </div>
            <ChevronDownIcon 
              className={cn(
                "w-4 h-4 text-[var(--text-muted)] transition-transform",
                expandedChannel === content.channel && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {expandedChannel === content.channel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-[var(--border)]"
              >
                <div className="p-4 space-y-4">
                  {/* Headline */}
                  <div>
                    <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Headline
                    </h5>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      {content.headline}
                    </p>
                  </div>

                  {/* Body */}
                  <div>
                    <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Body
                    </h5>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                      {content.body}
                    </p>
                  </div>

                  {/* CTA */}
                  <div>
                    <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      CTA
                    </h5>
                    <span className="inline-flex px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[13px] font-medium">
                      {content.cta}
                    </span>
                  </div>

                  {/* Visual Direction */}
                  <div>
                    <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Visual Direction
                    </h5>
                    <p className="text-[13px] text-[var(--text-secondary)] italic">
                      {content.visualDirection}
                    </p>
                  </div>

                  {/* Personalization */}
                  {content.personalization && content.personalization.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                        Personalization
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {content.personalization.map((token, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[13px] font-mono"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, React.ReactNode> = {
    email: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    sms: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    whatsapp: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      </svg>
    ),
    social: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
      </svg>
    ),
  };

  return (
    <div className="w-8 h-8 rounded-lg bg-[var(--surface-active)] flex items-center justify-center text-[var(--text-secondary)]">
      {icons[channel]}
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
