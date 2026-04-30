"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

interface ImageEditPanelProps {
  /** When set (e.g. channel drill-in), closing the panel also restores parent selection. */
  onClose?: () => void;
}

export function ImageEditPanel({ onClose }: ImageEditPanelProps) {
  const { imageEditState, updateImageEdit, closeInspectorDetail, isProcessing, setProcessing } =
    useToolsStore();
  const done = onClose ?? closeInspectorDetail;
  const { atomicBlocks, groups, pulseSyncTargets } = useWorkspaceStore();
  const [regeneratePrompt, setRegeneratePrompt] = useState("");

  const block = atomicBlocks.find((b) => b.id === imageEditState?.blockId);

  if (!block || !imageEditState) {
    return (
      <div className="p-4 text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">Select an image to edit</p>
      </div>
    );
  }

  const linkedChannels = block.linkedTo || [];
  const linkedInfo = linkedChannels
    .map((channelId) => {
      for (const group of groups) {
        const channel = group.channels.find((c) => c.id === channelId);
        if (channel) {
          return { group: group.name, channel: channel.channel };
        }
      }
      return null;
    })
    .filter(Boolean);

  const handleApply = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    if (imageEditState.mode === "propagate") {
      const ids = [block.id, ...linkedChannels];
      pulseSyncTargets(ids);
    }
    setProcessing(false);
    done();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarDrilldownHeader title="Image" onBack={done} />

      {/* Type badge + name */}
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
        <span className="mb-1.5 inline-block rounded bg-purple-100 px-2 py-0.5 text-[13px] font-semibold uppercase tracking-wider text-purple-700">
          Image Asset
        </span>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{block.content}</h3>
      </div>

      {/* Mode tabs */}
      <div className="flex shrink-0 border-b border-[var(--border)]">
        {(["replace", "crop", "regenerate", "propagate"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => updateImageEdit({ mode })}
            className={cn(
              "flex-1 py-2.5 text-[13px] font-medium capitalize transition-colors",
              imageEditState.mode === mode
                ? "border-b-2 border-neutral-900 text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {imageEditState.mode === "replace" && (
          <>
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
              <ImageIcon className="h-8 w-8 text-purple-400" />
            </div>
            <div className="space-y-2">
              <UploadRow icon={<UploadIcon className="h-5 w-5 text-[var(--text-secondary)]" />} title="Upload new image" subtitle="PNG, JPG up to 10MB" />
              <UploadRow icon={<SalesforceIcon className="h-5 w-5 text-[#00A1E0]" />} title="From Salesforce CMS" subtitle="Browse approved assets" bg="bg-blue-50" />
              <UploadRow icon={<SparklesIcon className="h-5 w-5 text-purple-500" />} title="Generate with AI" subtitle="Create from description" bg="bg-purple-50" />
            </div>
          </>
        )}

        {imageEditState.mode === "crop" && (
          <>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
              <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-neutral-900 bg-[var(--surface)] shadow-lg"
              >
                <div className="absolute inset-1 rounded-full bg-neutral-900" />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Aspect Ratio</p>
              <div className="grid grid-cols-4 gap-2">
                {["16:9", "1:1", "4:5", "9:16"].map((label) => (
                  <button key={label} className="rounded-lg bg-[var(--surface-active)] py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-neutral-200">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Focal Point</p>
              <p className="mb-2 text-[13px] text-[var(--text-secondary)]">Drag the marker to set the focus area for different channel crops</p>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-[var(--surface-active)] py-2 text-[13px] text-[var(--text-secondary)] hover:bg-neutral-200">Auto-detect</button>
                <button className="flex-1 rounded-lg bg-[var(--surface-active)] py-2 text-[13px] text-[var(--text-secondary)] hover:bg-neutral-200">Reset</button>
              </div>
            </div>
          </>
        )}

        {imageEditState.mode === "regenerate" && (
          <>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
              <ImageIcon className="h-8 w-8 text-purple-400" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[13px] text-white/80">Current</span>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">New Direction</p>
              <textarea
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Describe the new image direction…"
                className="h-24 w-full resize-none rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] focus:border-[var(--border)] focus:outline-none"
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Style Presets</p>
              <div className="flex flex-wrap gap-2">
                {["Editorial", "Lifestyle", "Product focus", "Minimal", "Bold"].map((style) => (
                  <button
                    key={style}
                    onClick={() => setRegeneratePrompt((p) => p + ` ${style.toLowerCase()} style`)}
                    className="rounded-full bg-[var(--surface-active)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-neutral-200"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-[13px] font-medium text-emerald-800">Brand colors will be maintained</span>
            </div>
          </>
        )}

        {imageEditState.mode === "propagate" && (
          <>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <PropagateIcon className="h-5 w-5 text-purple-600" />
                <span className="text-[13px] font-medium text-purple-900">Cascade Update</span>
              </div>
              <p className="text-[13px] text-purple-700">
                This update will propagate to {linkedInfo.length} linked channel
                {linkedInfo.length > 1 ? "s" : ""}.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Will Update</p>
              <div className="space-y-2">
                {linkedInfo.map(
                  (info, i) =>
                    info && (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--surface-subtle)] p-2">
                        <div className="flex items-center gap-2">
                          <ChannelIcon channel={info.channel} />
                          <span className="text-[13px] text-[var(--text-secondary)]">{info.group}</span>
                          <span className="text-[13px] text-[var(--text-muted)]">→</span>
                          <span className="text-[13px] font-medium capitalize text-[var(--text-primary)]">{info.channel}</span>
                        </div>
                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                    ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-[13px] text-[var(--text-secondary)]">Auto-adjust crops per channel</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-[13px] text-[var(--text-secondary)]">Maintain focal point</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span className="text-[13px] text-[var(--text-secondary)]">Apply color corrections</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Sticky apply button (not save/cancel — just a primary action) */}
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={isProcessing}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-[13px] font-medium text-white transition-colors",
            "hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing…
            </>
          ) : imageEditState.mode === "propagate" ? (
            "Propagate to all"
          ) : (
            "Apply changes"
          )}
        </button>
      </div>
    </div>
  );
}

function UploadRow({
  icon,
  title,
  subtitle,
  bg = "bg-[var(--surface-active)]",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bg?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface-hover)]"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}>{icon}</div>
      <div className="text-left">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-[13px] text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </button>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, React.ReactNode> = {
    email: <EmailIcon />,
    sms: <SMSIcon />,
    whatsapp: <WhatsAppIcon />,
    rcs: <RCSIcon />,
    web: <WebIcon />,
  };
  return <span className="h-4 w-4 text-[var(--text-secondary)]">{icons[channel]}</span>;
}

function ImageIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
}

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
}

function SalesforceIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M10.1 3.2c.95-1 2.25-1.6 3.7-1.6 2.05 0 3.85 1.2 4.65 2.95.65-.3 1.35-.45 2.1-.45 2.75 0 5 2.25 5 5s-2.25 5-5 5H4.25C1.9 14.1 0 12.2 0 9.85c0-2.05 1.45-3.75 3.4-4.15.15-1.45 1.35-2.6 2.85-2.6.65 0 1.25.2 1.75.55.45-.15.95-.25 1.45-.25.25 0 .45 0 .65.05v-.25z" /></svg>;
}

function SparklesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>;
}

function PropagateIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function EmailIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>; }
function SMSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function WhatsAppIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>; }
function RCSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function WebIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }
