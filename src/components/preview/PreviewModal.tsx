"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePreviewStore } from "@/stores/preview";
import { useCanvasStore } from "@/stores/canvas";
import { mockTestContacts, supportedLanguages } from "@/data/mock-contacts";
import { ChannelSwitcher } from "./ChannelSwitcher";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { DeviceFrame } from "./DeviceFrame";
import { EmailPreview } from "./EmailPreview";
import { SMSPreview } from "./SMSPreview";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { ContactSelector } from "./ContactSelector";
import { LanguageSelector } from "./LanguageSelector";
import { SendDestinationSelect } from "./SendDestinationSelect";
import { cn } from "@/lib/cn";

type PreviewState = "idle" | "loading" | "ready" | "error";

export function PreviewModal() {
  const { blocks } = useCanvasStore();
  const {
    isOpen,
    selectedChannel,
    selectedDevice,
    selectedContactId,
    selectedLanguage,
    previewContent,
    testEmail,
    isSending,
    sendSuccess,
    savedTestEmails,
    closePanel,
    setChannel,
    setDevice,
    setContact,
    setLanguage,
    setTestEmail,
    sendTest,
    addSavedTestEmail,
  } = usePreviewStore();

  const [previewState, setPreviewState] = useState<PreviewState>("idle");

  // Get the content to preview
  const content = previewContent || blocks.find((b) => b.channel === selectedChannel);
  const contact = mockTestContacts.find((c) => c.id === selectedContactId);
  const language = supportedLanguages.find((l) => l.code === selectedLanguage);

  // Load preview once when opened
  const loadPreview = useCallback(async () => {
    if (!isOpen) return;
    
    setPreviewState("loading");
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (content && contact) {
      setPreviewState("ready");
    } else {
      setPreviewState("error");
    }
  }, [isOpen, content, contact]);

  useEffect(() => {
    if (isOpen) {
      loadPreview();
    } else {
      setPreviewState("idle");
    }
  }, [isOpen, loadPreview]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closePanel]);

  const renderPreview = () => {
    if (previewState === "loading") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="10" fill="none"
                  stroke="url(#previewSpinner)" strokeWidth="2"
                  strokeLinecap="round" strokeDasharray="60" strokeDashoffset="40"
                />
                <defs>
                  <linearGradient id="previewSpinner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00A1E0" />
                    <stop offset="100%" stopColor="#6B5ACC" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <p className="text-[13px] text-[var(--text-secondary)]">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (previewState === "error" || !content || !contact) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--surface-active)] flex items-center justify-center">
              <AlertIcon className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium">No content available</p>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">Select content to preview</p>
          </div>
        </div>
      );
    }

    switch (selectedChannel) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - z-index: modal-backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: "var(--z-modal-backdrop)" }}
            onClick={closePanel}
          />

          {/* Modal - z-index: modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 flex items-center justify-center"
            style={{ zIndex: "var(--z-modal)" }}
          >
            <div
              className={cn(
                "bg-[var(--surface)] rounded-2xl shadow-2xl",
                "w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00A1E0] to-[#6B5ACC] flex items-center justify-center">
                    <PreviewIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-heading-small text-[var(--text-primary)]">
                      Preview & Test
                    </h2>
                    <p className="text-[13px] text-[var(--text-muted)]">
                      {previewState === "ready" && contact 
                        ? `Previewing as ${contact.firstName} ${contact.lastName}`
                        : "Select a contact to preview"
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="p-2 rounded-lg hover:bg-[var(--surface-active)] transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex h-full">
                  {/* Preview area */}
                  <div className="flex-1 p-6 bg-[var(--surface-subtle)] flex items-center justify-center">
                    <DeviceFrame device={selectedDevice}>
                      {renderPreview()}
                    </DeviceFrame>
                  </div>

                  {/* Controls sidebar - LIGHT THEME */}
                  <div className="w-[280px] border-l border-[var(--border)] bg-[var(--surface)] p-5 space-y-6 overflow-y-auto">
                    {/* Channel */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Channel
                      </label>
                      <ChannelSwitcher
                        selected={selectedChannel}
                        onChange={setChannel}
                      />
                    </div>
                    
                    {/* Device */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Device
                      </label>
                      <DeviceSwitcher
                        selected={selectedDevice}
                        onChange={setDevice}
                      />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--surface-active)]" />

                    {/* Personalization */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Preview As
                      </label>
                      <ContactSelector
                        omitLabel
                        selected={selectedContactId}
                        onChange={setContact}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Language
                      </label>
                      <LanguageSelector
                        omitLabel
                        selected={selectedLanguage}
                        onChange={setLanguage}
                      />
                    </div>

                    {/* Language banner */}
                    {selectedLanguage !== "en-US" && language && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 text-[13px] text-blue-700">
                          <GlobeIcon className="w-4 h-4" />
                          <span>Viewing in {language.label}</span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-[var(--surface-active)]" />

                    {/* Send Test */}
                    <SendDestinationSelect
                      mode="email"
                      value={testEmail}
                      onChange={setTestEmail}
                      saved={savedTestEmails}
                      onSaveNew={addSavedTestEmail}
                      onSend={() => {
                        void sendTest();
                      }}
                      isSending={isSending}
                      success={sendSuccess}
                      previewInfo={
                        contact && language
                          ? `${contact.firstName} ${contact.lastName} · ${language.label} · ${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)}`
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
