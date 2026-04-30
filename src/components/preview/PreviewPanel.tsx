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
type EditMode = "preview" | "text" | "image" | "style" | "spacing";

export function PreviewPanel() {
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
  const [editMode, setEditMode] = useState<EditMode>("preview");
  const [activeTab, setActiveTab] = useState<"controls" | "edit">("controls");

  const content = previewContent || blocks.find((b) => b.channel === selectedChannel);
  const contact = mockTestContacts.find((c) => c.id === selectedContactId);
  const language = supportedLanguages.find((l) => l.code === selectedLanguage);

  const loadPreview = useCallback(async () => {
    if (!isOpen) return;
    setPreviewState("loading");
    await new Promise((resolve) => setTimeout(resolve, 400));
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
      setEditMode("preview");
      setActiveTab("controls");
    }
  }, [isOpen, loadPreview]);

  const renderPreview = () => {
    if (previewState === "loading") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <motion.div
              className="w-6 h-6 mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="10" fill="none"
                  stroke="url(#previewSpinnerPanel)" strokeWidth="2"
                  strokeLinecap="round" strokeDasharray="60" strokeDashoffset="40"
                />
                <defs>
                  <linearGradient id="previewSpinnerPanel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00A1E0" />
                    <stop offset="100%" stopColor="#6B5ACC" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <p className="text-[13px] text-[var(--text-muted)]">Loading...</p>
          </div>
        </div>
      );
    }

    if (previewState === "error" || !content || !contact) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[var(--surface-active)] flex items-center justify-center">
              <AlertIcon className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium">No content</p>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Select content to preview</p>
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
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden flex-shrink-0 flex flex-col"
          style={{ zIndex: "var(--z-sidebar)" }}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A1E0] to-[#6B5ACC] flex items-center justify-center">
                  <PreviewIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-[var(--text-primary)]">
                    Preview & Edit
                  </h2>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {previewState === "ready" && contact
                      ? `${contact.firstName} · ${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)}`
                      : "Configure preview"}
                  </p>
                </div>
              </div>
              <button
                onClick={closePanel}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-active)] transition-colors"
              >
                <CloseIcon className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-shrink-0 p-4 bg-[var(--surface-subtle)] border-b border-[var(--border)]">
            <div className="flex justify-center">
              <div className={cn(
                "transition-all duration-300",
                selectedDevice === "mobile" ? "w-[200px]" : "w-full max-w-[320px]"
              )}>
                <DeviceFrame device={selectedDevice} compact>
                  <div className="h-[280px] overflow-hidden">
                    {renderPreview()}
                  </div>
                </DeviceFrame>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1 p-1 bg-[var(--surface-subtle)] rounded-xl">
              <button
                onClick={() => setActiveTab("controls")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                  activeTab === "controls"
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Controls
                </span>
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                  activeTab === "edit"
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <EditIcon className="w-3.5 h-3.5" />
                  Edit
                </span>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === "controls" ? (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="p-4 space-y-5"
                >
                  {/* Channel & Device */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Channel
                      </label>
                      <ChannelSwitcher selected={selectedChannel} onChange={setChannel} compact />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Device
                      </label>
                      <DeviceSwitcher selected={selectedDevice} onChange={setDevice} compact />
                    </div>
                  </div>

                  <div className="h-px bg-[var(--surface-active)]" />

                  {/* Personalization */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Preview As
                    </label>
                    <ContactSelector omitLabel selected={selectedContactId} onChange={setContact} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Language
                    </label>
                    <LanguageSelector omitLabel selected={selectedLanguage} onChange={setLanguage} />
                  </div>

                  {selectedLanguage !== "en-US" && language && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-2 text-[13px] text-blue-700">
                        <GlobeIcon className="w-3.5 h-3.5" />
                        <span>Viewing in {language.label}</span>
                      </div>
                    </div>
                  )}

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
                        ? `${contact.firstName} · ${language.label}`
                        : undefined
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="p-4 space-y-4"
                >
                  {/* Edit mode selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Edit Mode
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "text" as EditMode, icon: <TypeIcon className="w-4 h-4" />, label: "Text" },
                        { id: "image" as EditMode, icon: <ImageIcon className="w-4 h-4" />, label: "Image" },
                        { id: "style" as EditMode, icon: <PaletteIcon className="w-4 h-4" />, label: "Colors" },
                        { id: "spacing" as EditMode, icon: <SpacingIcon className="w-4 h-4" />, label: "Spacing" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setEditMode(mode.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                            editMode === mode.id
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)]"
                          )}
                        >
                          {mode.icon}
                          <span className="text-[13px] font-medium">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-[var(--surface-active)]" />

                  {/* Edit panels based on mode */}
                  <AnimatePresence mode="wait">
                    {editMode === "text" && (
                      <motion.div
                        key="text-edit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <TextEditPanel />
                      </motion.div>
                    )}
                    {editMode === "image" && (
                      <motion.div
                        key="image-edit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <ImageEditPanel />
                      </motion.div>
                    )}
                    {editMode === "style" && (
                      <motion.div
                        key="style-edit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <StyleEditPanel />
                      </motion.div>
                    )}
                    {editMode === "spacing" && (
                      <motion.div
                        key="spacing-edit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <SpacingEditPanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TextEditPanel() {
  const [headline, setHeadline] = useState("Discover Our New Collection");
  const [body, setBody] = useState("Experience premium quality and timeless design with our latest arrivals.");
  const [cta, setCta] = useState("Shop Now");

  return (
    <>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Headline
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/20 focus:border-[#00A1E0]"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Body Copy
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/20 focus:border-[#00A1E0]"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Call to Action
        </label>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/20 focus:border-[#00A1E0]"
        />
      </div>
      <button className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors">
        Apply Changes
      </button>
    </>
  );
}

function ImageEditPanel() {
  return (
    <>
      <div className="aspect-video rounded-xl bg-[var(--surface-active)] border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all">
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-[13px] text-[var(--text-secondary)] font-medium">Click to replace</p>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">or drag and drop</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Focal Point X
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="50"
            className="w-full accent-[#00A1E0]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Focal Point Y
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="50"
            className="w-full accent-[#00A1E0]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-medium hover:bg-[var(--surface-hover)] transition-colors">
          Crop
        </button>
        <button className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-medium hover:bg-[var(--surface-hover)] transition-colors">
          Regenerate
        </button>
      </div>
    </>
  );
}

function StyleEditPanel() {
  const colors = [
    { name: "Primary", value: "#00A1E0" },
    { name: "Secondary", value: "#6B5ACC" },
    { name: "Background", value: "#FFFFFF" },
    { name: "Text", value: "#1A1A1A" },
  ];

  return (
    <>
      <div className="space-y-3">
        {colors.map((color) => (
          <div key={color.name} className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-secondary)] font-medium">{color.name}</span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color.value }}
              />
              <input
                type="text"
                value={color.value}
                readOnly
                className="w-20 px-2 py-1.5 rounded-lg border border-[var(--border)] text-[13px] text-[var(--text-secondary)] font-mono bg-[var(--surface-subtle)]"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="h-px bg-[var(--surface-active)]" />
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Button Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["Filled", "Outline", "Text"].map((style) => (
            <button
              key={style}
              className={cn(
                "py-2 rounded-lg text-[13px] font-medium border transition-all",
                style === "Filled"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]"
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SpacingEditPanel() {
  const [padding, setPadding] = useState({ top: 24, right: 24, bottom: 24, left: 24 });
  const [gap, setGap] = useState(16);

  return (
    <>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Padding
        </label>
        <div className="relative bg-[var(--surface-subtle)] rounded-xl p-4">
          <div className="grid grid-cols-3 gap-2 items-center">
            <div />
            <input
              type="number"
              value={padding.top}
              onChange={(e) => setPadding({ ...padding, top: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-center text-[13px] text-[var(--text-secondary)]"
            />
            <div />
            <input
              type="number"
              value={padding.left}
              onChange={(e) => setPadding({ ...padding, left: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-center text-[13px] text-[var(--text-secondary)]"
            />
            <div className="aspect-square rounded-lg bg-neutral-200 flex items-center justify-center">
              <span className="text-[13px] text-[var(--text-secondary)]">Content</span>
            </div>
            <input
              type="number"
              value={padding.right}
              onChange={(e) => setPadding({ ...padding, right: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-center text-[13px] text-[var(--text-secondary)]"
            />
            <div />
            <input
              type="number"
              value={padding.bottom}
              onChange={(e) => setPadding({ ...padding, bottom: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-center text-[13px] text-[var(--text-secondary)]"
            />
            <div />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Element Gap
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="48"
            value={gap}
            onChange={(e) => setGap(parseInt(e.target.value))}
            className="flex-1 accent-[#00A1E0]"
          />
          <span className="text-[13px] text-[var(--text-secondary)] font-mono w-10 text-right">{gap}px</span>
        </div>
      </div>
      <button className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors">
        Apply Spacing
      </button>
    </>
  );
}

// Icons
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function SpacingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="18" y1="2" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="22" />
      <line x1="18" y1="20" x2="18" y2="22" />
      <line x1="2" y1="6" x2="4" y2="6" />
      <line x1="2" y1="18" x2="4" y2="18" />
      <line x1="20" y1="6" x2="22" y2="6" />
      <line x1="20" y1="18" x2="22" y2="18" />
    </svg>
  );
}
