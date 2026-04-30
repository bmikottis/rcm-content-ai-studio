"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePreviewStore } from "@/stores/preview";
import { useWorkspaceStore } from "@/stores/workspace";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { mockTestContacts, supportedLanguages } from "@/data/mock-contacts";
import { buildPreviewTouchpoints } from "@/lib/preview-from-workspace";
import type { PreviewTouchpoint } from "@/lib/preview-from-workspace";
import { variantToContentBlock } from "@/lib/card-to-preview";
import { DeviceFrame } from "./DeviceFrame";
import { EmailPreview } from "./EmailPreview";
import { SMSPreview } from "./SMSPreview";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { ContactSelector } from "./ContactSelector";
import { LanguageSelector } from "./LanguageSelector";
import { SendDestinationSelect } from "./SendDestinationSelect";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContentTypeIcon } from "@/components/ui/ContentTypeIcon";
import { toast } from "@/stores/toast";
import { usePublishStore } from "@/stores/publish";
import { cn } from "@/lib/cn";

interface PreviewViewProps {
  selectedChannelId?: string | null;
  selectedChannelIds?: string[];
  onSelectChannel?: (id: string | null) => void;
  touchpoints?: PreviewTouchpoint[];
}

export function PreviewView({ selectedChannelId: externalId, selectedChannelIds: externalIds, onSelectChannel, touchpoints: externalTouchpoints }: PreviewViewProps = {}) {
  const { groups, atomicBlocks } = useWorkspaceStore();
  const {
    selectedDevice,
    selectedContactId,
    selectedLanguage,
    testEmail,
    testPhone,
    isSending,
    sendSuccess,
    isSendingPhone,
    sendPhoneSuccess,
    savedTestEmails,
    savedTestPhones,
    setDevice,
    setContact,
    setLanguage,
    setTestEmail,
    setTestPhone,
    sendTest,
    sendPhoneTest,
    addSavedTestEmail,
    addSavedTestPhone,
  } = usePreviewStore();
  const { updateCard, cards: simpleCards, selectedVariantId, selectVariant, selectCard } = useSimpleCanvasStore();

  const [internalId, setInternalId] = useState<string | null>(null);
  const selectedChannelId = externalId ?? internalId;
  const setSelectedChannelId = onSelectChannel ?? setInternalId;
  const { isPublishing: isPublishingGlobal, publishCards } = usePublishStore();

  const workspaceTouchpoints = useMemo(
    () => buildPreviewTouchpoints(groups, atomicBlocks),
    [groups, atomicBlocks],
  );

  const touchpoints = externalTouchpoints ?? workspaceTouchpoints;

  const selectedTouchpoint = useMemo(
    () => touchpoints.find((t) => t.key === selectedChannelId) ?? null,
    [touchpoints, selectedChannelId],
  );

  const contact = mockTestContacts.find((c) => c.id === selectedContactId);
  const language = supportedLanguages.find((l) => l.code === selectedLanguage);

  // Resolve the active card and variant for the selected touchpoint
  const activeCard = useMemo(
    () => (selectedChannelId ? simpleCards.find((c) => c.id === selectedChannelId) ?? null : null),
    [selectedChannelId, simpleCards],
  );
  const activeVariant = useMemo(
    () => (activeCard && selectedVariantId ? activeCard.variants?.find((v) => v.id === selectedVariantId) ?? null : null),
    [activeCard, selectedVariantId],
  );

  // Override touchpoint content when a variant is selected
  const effectiveTouchpoint = useMemo(() => {
    if (!selectedTouchpoint) return null;
    if (activeCard && activeVariant) {
      return { ...selectedTouchpoint, content: variantToContentBlock(activeCard, activeVariant) };
    }
    return selectedTouchpoint;
  }, [selectedTouchpoint, activeCard, activeVariant]);

  // Resolve all selected touchpoints for multi-block preview
  const selectedIds = externalIds ?? (selectedChannelId ? [selectedChannelId] : []);
  const isMultiPreview = selectedIds.length > 1;

  const multiTouchpoints = useMemo(() => {
    if (!isMultiPreview) return [];
    return selectedIds
      .map((id) => touchpoints.find((t) => t.key === id))
      .filter((t): t is PreviewTouchpoint => Boolean(t));
  }, [selectedIds, touchpoints, isMultiPreview]);

  const hasEmail = isMultiPreview && multiTouchpoints.some((t) => t.channel.channel === "email");
  const multiChannelTypes = useMemo(() => {
    if (!isMultiPreview) return new Set<string>();
    return new Set(multiTouchpoints.map((t) => t.channel.channel));
  }, [isMultiPreview, multiTouchpoints]);
  const isUniformChannel = isMultiPreview && multiChannelTypes.size === 1;
  const uniformChannel = isUniformChannel ? [...multiChannelTypes][0] : null;

  // Auto-select first touchpoint if nothing selected
  useEffect(() => {
    if (!selectedChannelId && touchpoints.length > 0) {
      setSelectedChannelId(touchpoints[0].key);
    }
  }, [touchpoints, selectedChannelId, setSelectedChannelId]);

  useEffect(() => {
    usePreviewStore.setState({ sendSuccess: false, sendPhoneSuccess: false });
  }, [selectedChannelId]);

  const renderPreviewContent = (content: PreviewTouchpoint["content"]) => {
    if (!contact) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center">
          <p className="text-[13px] text-[var(--text-muted)]">Choose a preview contact</p>
        </div>
      );
    }

    switch (content.channel) {
      case "email":
        return <EmailPreview content={content} contact={contact} />;
      case "sms":
        return <SMSPreview content={content} contact={contact} />;
      case "whatsapp":
        return <WhatsAppPreview content={content} contact={contact} />;
      default:
        return null;
    }
  };

  const touchpointTitle = (t: PreviewTouchpoint) =>
    t.channel.displayName?.trim() ||
    `${t.channel.channel.charAt(0).toUpperCase() + t.channel.channel.slice(1)} · ${t.groupName}`;

  const [search, setSearch] = useState("");

  const filteredTouchpoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return touchpoints;
    return touchpoints.filter((tp) => {
      const name = touchpointTitle(tp).toLowerCase();
      const ch = tp.channel.channel.toLowerCase();
      return name.includes(q) || ch.includes(q);
    });
  }, [touchpoints, search]);

  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [isNarrowPreview, setIsNarrowPreview] = useState(false);

  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrowPreview(entry.contentRect.width < 480);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveDevice = isNarrowPreview ? "desktop" : selectedDevice;

  return (
    <div ref={previewAreaRef} className="relative h-full min-h-0 w-full max-w-full overflow-hidden bg-[var(--background)]">
      {/* Center: Preview content — avoids left explorer and right settings panels */}
      <div className="absolute inset-0 overflow-auto scrollbar-hide">
        <div
          className={cn("flex pt-[72px] pb-[120px] min-h-full", isMultiPreview ? "flex-col items-center gap-8" : "justify-center items-start")}
          style={{ paddingLeft: 320, paddingRight: 304 }}
        >
          {isMultiPreview ? (
            multiTouchpoints.map((tp) => (
              <motion.div
                key={tp.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ContentTypeIcon type={tp.channel.channel as "email" | "sms" | "whatsapp"} size="sm" />
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{touchpointTitle(tp)}</span>
                </div>
                <div
                  className={cn(
                    "min-w-0 transition-all duration-300",
                    "w-full",
                    tp.channel.channel === "email" && effectiveDevice !== "mobile"
                      ? "max-w-[72rem]"
                      : "",
                  )}
                >
                  <DeviceFrame
                    device={tp.channel.channel === "email" ? effectiveDevice : (isNarrowPreview ? "desktop" : "mobile")}
                  >
                    {renderPreviewContent(tp.content)}
                  </DeviceFrame>
                </div>
              </motion.div>
            ))
          ) : effectiveTouchpoint ? (
            <motion.div
              key={`${effectiveTouchpoint.key}-${activeVariant?.id ?? "base"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <div
                className={cn(
                  "min-w-0 transition-all duration-300",
                  "w-full",
                  effectiveTouchpoint.channel.channel === "email" && effectiveDevice !== "mobile"
                    ? "max-w-[72rem]"
                    : "",
                )}
              >
                <DeviceFrame
                  device={effectiveTouchpoint.channel.channel === "email" ? effectiveDevice : (isNarrowPreview ? "desktop" : "mobile")}
                >
                  {renderPreviewContent(effectiveTouchpoint.content)}
                </DeviceFrame>
              </div>
            </motion.div>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)] mt-20">Select a channel to preview</p>
          )}
        </div>
      </div>

      {/* Floating right panel: Preview Settings — matches CanvasExplorer style */}
      <div
        className="pointer-events-auto absolute top-[68px] right-3 bottom-[60px] flex w-[280px] flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-panel)]"
        style={{ zIndex: "var(--z-panel)" }}
      >
        {/* Panel header */}
        <div className="flex h-[48px] shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[-0.01em]">Preview Settings</span>
          </div>
        </div>

        {/* Device toggle — show when email is among selected (single or multi) */}
        {((!isMultiPreview && selectedTouchpoint?.channel.channel === "email") || hasEmail) && (
          <div className="flex items-center gap-0 px-3 py-2 border-b border-[var(--border)] shrink-0">
            {(["desktop", "mobile"] as const).map((device) => {
              const isActive = selectedDevice === device;
              return (
                <button
                  key={device}
                  type="button"
                  onClick={() => setDevice(device)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-[13px] font-medium transition-colors",
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="previewDeviceIndicator"
                      className="absolute inset-0 bg-[var(--surface-active)] rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {device === "desktop" ? <DesktopIcon className="w-3.5 h-3.5" /> : <MobileIcon className="w-3.5 h-3.5" />}
                    {device.charAt(0).toUpperCase() + device.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {isMultiPreview ? (
            <>
              {/* Multi-selection: Selected blocks list */}
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                  Selected · {multiTouchpoints.length} blocks
                </p>
                <div className="space-y-1">
                  {multiTouchpoints.map((tp) => (
                    <div
                      key={tp.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--surface-subtle)]"
                    >
                      <ContentTypeIcon type={tp.channel.channel as "email" | "sms" | "whatsapp"} size="sm" />
                      <span className="text-[13px] font-medium text-[var(--text-secondary)] truncate flex-1">{touchpointTitle(tp)}</span>
                      <StatusBadge status={tp.channel.status === "approved" ? "approved" : tp.channel.status} size="xs" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel summary */}
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Channels</p>
                <div className="flex items-center gap-3">
                  {(() => {
                    const channels: Record<string, number> = {};
                    for (const tp of multiTouchpoints) {
                      channels[tp.channel.channel] = (channels[tp.channel.channel] ?? 0) + 1;
                    }
                    return Object.entries(channels).map(([ch, count]) => (
                      <div key={ch} className="flex items-center gap-1.5">
                        <ContentTypeIcon type={ch as "email" | "sms" | "whatsapp"} size="sm" />
                        <span className="text-[13px] text-[var(--text-secondary)]">{count} {ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Single selection: Selected touchpoint detail */}
              {selectedTouchpoint && (
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Selected</p>
                  <div className="flex items-center gap-2">
                    <ContentTypeIcon type={selectedTouchpoint.channel.channel as "email" | "sms" | "whatsapp"} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{touchpointTitle(selectedTouchpoint)}</p>
                      <p className="text-[13px] text-[var(--text-muted)]">
                        {selectedTouchpoint.channel.channel.charAt(0).toUpperCase() + selectedTouchpoint.channel.channel.slice(1)}
                      </p>
                    </div>
                    <StatusBadge status={selectedTouchpoint.channel.status === "approved" ? "approved" : selectedTouchpoint.channel.status} size="xs" />
                  </div>

                  {(selectedTouchpoint.channel.channel === "sms" ||
                    selectedTouchpoint.channel.channel === "whatsapp") && (
                    <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                      Length:{" "}
                      <span className="font-bold tabular-nums text-[var(--text-primary)]">
                        {selectedTouchpoint.content.characterCount ?? selectedTouchpoint.content.body.length}
                      </span>{" "}
                      chars
                    </p>
                  )}
                </div>
              )}

              {/* Variant picker — only when the card has variants */}
              {activeCard && activeCard.variants && activeCard.variants.length > 0 && (
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Variant</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => { selectCard(activeCard.id); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors",
                        !selectedVariantId
                          ? "bg-[var(--surface-active)] border border-[var(--accent)]/20"
                          : "bg-[var(--surface-subtle)] border border-transparent hover:bg-[var(--surface-active)]",
                      )}
                    >
                      <span className={cn(
                        "text-[13px] font-medium truncate flex-1",
                        !selectedVariantId ? "text-[var(--accent)]" : "text-[var(--text-secondary)]",
                      )}>
                        Original
                      </span>
                      <StatusBadge status={activeCard.status} size="xs" />
                    </button>
                    {activeCard.variants.map((v) => {
                      const isActive = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => selectVariant(activeCard.id, v.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors",
                            isActive
                              ? "bg-[var(--surface-active)] border border-[var(--accent)]/20"
                              : "bg-[var(--surface-subtle)] border border-transparent hover:bg-[var(--surface-active)]",
                          )}
                        >
                          <span className={cn(
                            "text-[13px] font-medium truncate flex-1",
                            isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]",
                          )}>
                            {v.label}
                          </span>
                          <StatusBadge status={v.status} size="xs" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Preview as — always shown */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Preview as</p>
            <ContactSelector omitLabel selected={selectedContactId} onChange={setContact} />
          </div>

          {/* Send test — single selection */}
          {!isMultiPreview && selectedTouchpoint && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Send test</p>
              {selectedTouchpoint.channel.channel === "email" ? (
                <SendDestinationSelect
                  mode="email"
                  value={testEmail}
                  onChange={setTestEmail}
                  saved={savedTestEmails}
                  onSaveNew={addSavedTestEmail}
                  onSend={() => { void sendTest(); }}
                  isSending={isSending}
                  success={sendSuccess}
                  previewInfo={
                    contact && language
                      ? `${contact.firstName} · ${language.label} · ${touchpointTitle(selectedTouchpoint)}`
                      : touchpointTitle(selectedTouchpoint)
                  }
                />
              ) : (
                <SendDestinationSelect
                  mode="phone"
                  value={testPhone}
                  onChange={setTestPhone}
                  saved={savedTestPhones}
                  onSaveNew={addSavedTestPhone}
                  onSend={() => { void sendPhoneTest(); }}
                  isSending={isSendingPhone}
                  success={sendPhoneSuccess}
                  previewInfo={
                    contact && language
                      ? `${contact.firstName} · ${language.label} · ${touchpointTitle(selectedTouchpoint)}`
                      : touchpointTitle(selectedTouchpoint)
                  }
                />
              )}
            </div>
          )}

          {/* Batch send test — multi-selection with uniform channel */}
          {isMultiPreview && isUniformChannel && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Batch send test · {multiTouchpoints.length} {uniformChannel === "email" ? "emails" : "messages"}
              </p>
              {uniformChannel === "email" ? (
                <SendDestinationSelect
                  mode="email"
                  value={testEmail}
                  onChange={setTestEmail}
                  saved={savedTestEmails}
                  onSaveNew={addSavedTestEmail}
                  onSend={() => { void sendTest(); }}
                  isSending={isSending}
                  success={sendSuccess}
                  previewInfo={
                    contact
                      ? `${contact.firstName} · ${multiTouchpoints.length} emails`
                      : `${multiTouchpoints.length} emails`
                  }
                />
              ) : (
                <SendDestinationSelect
                  mode="phone"
                  value={testPhone}
                  onChange={setTestPhone}
                  saved={savedTestPhones}
                  onSaveNew={addSavedTestPhone}
                  onSend={() => { void sendPhoneTest(); }}
                  isSending={isSendingPhone}
                  success={sendPhoneSuccess}
                  previewInfo={
                    contact
                      ? `${contact.firstName} · ${multiTouchpoints.length} messages`
                      : `${multiTouchpoints.length} messages`
                  }
                />
              )}
            </div>
          )}

          {/* Mixed channels hint */}
          {isMultiPreview && !isUniformChannel && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Send test</p>
              <p className="text-[13px] text-[var(--text-muted)] py-2">Select blocks of the same channel type to batch send tests.</p>
            </div>
          )}
        </div>

        {/* Publish button */}
        <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
          {(() => {
            if (isMultiPreview) {
              const ids = multiTouchpoints
                .map((tp) => simpleCards.find((c) => c.id === tp.key))
                .filter((c): c is NonNullable<typeof c> => !!c && c.status !== "published")
                .map((c) => c.id);
              return (
                <button
                  type="button"
                  disabled={isPublishingGlobal || ids.length === 0}
                  onClick={() => publishCards(ids)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
                >
                  <PublishIcon className="w-3.5 h-3.5" /> Publish {multiTouchpoints.length} Blocks
                </button>
              );
            }

            if (!activeCard) return null;

            if (activeCard.status === "published") return null;

            return (
              <button
                type="button"
                disabled={isPublishingGlobal}
                onClick={() => publishCards([activeCard.id])}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
              >
                <PublishIcon className="w-3.5 h-3.5" /> Publish
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function SMSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PreviewEyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function PublishIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
