"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

export function LinkPanel() {
  const { setActiveTool, isProcessing, setProcessing } = useToolsStore();
  const clearSelection = useWorkspaceStore((s) => s.clearSelection);
  const { selectedIds, groups, atomicBlocks, connections } = useWorkspaceStore();
  const [pendingUnlinks, setPendingUnlinks] = useState<string[]>([]);

  const selectedBlock = atomicBlocks.find(b => selectedIds.includes(b.id));

  if (!selectedBlock) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-active)] flex items-center justify-center mx-auto mb-3">
          <LinkIcon className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium">Link / Unlink Assets</p>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">Select an atomic block to manage its links</p>
      </div>
    );
  }

  const linkedChannels = selectedBlock.linkedTo || [];

  // Find all available channels to link to
  const allChannels = groups.flatMap(g => 
    g.channels.map(c => ({
      id: c.id,
      channel: c.channel,
      group: g.name,
      color: g.color,
      isLinked: linkedChannels.includes(c.id),
    }))
  );

  const handleToggleLink = (channelId: string) => {
    if (pendingUnlinks.includes(channelId)) {
      setPendingUnlinks(prev => prev.filter(id => id !== channelId));
    } else {
      setPendingUnlinks(prev => [...prev, channelId]);
    }
  };

  const handleApply = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPendingUnlinks([]);
    setProcessing(false);
    setActiveTool("select");
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarDrilldownHeader
        title="Links"
        onBack={() => {
          clearSelection();
          setActiveTool("select");
        }}
        backAriaLabel="Close links"
      />
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
        <span className="mb-2 inline-block rounded bg-purple-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-purple-700">
          {selectedBlock.type}
        </span>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{selectedBlock.content}</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Linked to {linkedChannels.length} channel{linkedChannels.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Explanation */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start gap-2">
          <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-blue-700">
            <strong>Linked</strong> items stay synchronized. Changes to this asset will cascade to all linked channels. <strong>Unlink</strong> to edit independently.
          </p>
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          Channel Connections
        </p>

        {allChannels.map(ch => {
          const isPendingUnlink = pendingUnlinks.includes(ch.id);
          const willBeLinked = ch.isLinked && !isPendingUnlink;

          return (
            <motion.div
              key={ch.id}
              layout
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                willBeLinked
                  ? "bg-[var(--surface)] border-[var(--border)]"
                  : "bg-[var(--surface-subtle)] border-[var(--border)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: willBeLinked ? `${ch.color}15` : "#f5f5f5" }}
                >
                  <ChannelIcon channel={ch.channel} linked={willBeLinked} />
                </div>
                <div>
                  <p className={cn(
                    "text-[13px] font-medium capitalize",
                    willBeLinked ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  )}>
                    {ch.channel}
                  </p>
                  <p className="text-[13px] text-[var(--text-muted)]">{ch.group}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleLink(ch.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                  willBeLinked
                    ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                    : ch.isLinked
                      ? "bg-red-100 text-red-600"
                      : "bg-[var(--surface-active)] text-[var(--text-secondary)] hover:bg-emerald-100 hover:text-emerald-700"
                )}
              >
                {willBeLinked ? (
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Linked
                  </span>
                ) : ch.isLinked ? (
                  <span className="flex items-center gap-1">
                    <UnlinkIcon className="w-3 h-3" />
                    Will unlink
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <PlusIcon className="w-3 h-3" />
                    Link
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Pending changes */}
      <AnimatePresence>
        {pendingUnlinks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-amber-50 border-t border-amber-100"
          >
            <p className="text-[13px] text-amber-800">
              <strong>{pendingUnlinks.length} change{pendingUnlinks.length > 1 ? "s" : ""}</strong> pending
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={handleApply}
          disabled={pendingUnlinks.length === 0 || isProcessing}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all",
            "bg-neutral-900 text-white hover:bg-neutral-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            <>Apply changes</>
          )}
        </button>
        <button
          onClick={() => {
            setPendingUnlinks([]);
            setActiveTool("select");
          }}
          disabled={isProcessing}
          className="w-full py-2 px-4 rounded-lg text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChannelIcon({ channel, linked }: { channel: string; linked: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    email: <EmailIcon />,
    sms: <SMSIcon />,
    whatsapp: <WhatsAppIcon />,
    rcs: <RCSIcon />,
    web: <WebIcon />,
  };
  return (
    <span className={cn("w-4 h-4", linked ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]")}>
      {icons[channel]}
    </span>
  );
}

// Icons
function LinkIcon({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
}

function UnlinkIcon({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

function InfoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
}

function EmailIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>; }
function SMSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function WhatsAppIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>; }
function RCSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function WebIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }
