"use client";

import { useRef, useState } from "react";
import { DetachedDropdown } from "./DetachedDropdown";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Mode = "email" | "phone";

interface SendDestinationSelectProps {
  mode: Mode;
  value: string;
  onChange: (value: string) => void;
  saved: string[];
  onSaveNew: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  success: boolean;
  previewInfo?: string;
}

export function SendDestinationSelect({
  mode,
  value,
  onChange,
  saved,
  onSaveNew,
  onSend,
  isSending,
  success,
  previewInfo,
}: SendDestinationSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const label = mode === "email" ? "Email" : "Number";
  const placeholder = mode === "email" ? "name@company.com" : "+1 415 555 0123";
  const list = saved.filter(Boolean);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setAdding(false);
    setDraft("");
  };

  const commitNew = () => {
    const v = draft.trim();
    if (!v) return;
    onSaveNew(v);
    setAdding(false);
    setDraft("");
    setOpen(false);
  };

  if (success) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-green-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-[var(--success)]">
          <span>✓</span>
          <span className="font-medium">Test sent successfully</span>
        </div>
        <p className="text-body-sm text-[var(--text-secondary)]">
          {mode === "email" ? (
            <>Check {value.trim()} for the test message.</>
          ) : (
            <>Test queued to {value.trim()}.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-medium text-neutral-500">Send test to</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setAdding(false);
        }}
        className={cn(
          "flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-left text-[13px] transition-colors",
          "hover:border-[var(--text-muted)]",
          !value.trim() && "text-[var(--text-muted)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
          {value.trim() || `Choose saved ${label.toLowerCase()} or add new`}
        </span>
        <span className="shrink-0 text-[var(--text-muted)]">▾</span>
      </button>

      <DetachedDropdown open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} maxHeight={320}>
        {!adding ? (
          <>
            {list.length === 0 ? (
              <p className="px-3 py-2 text-[13px] text-[var(--text-muted)]">No saved {label.toLowerCase()}s yet.</p>
            ) : (
              list.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pick(item)}
                  className={cn(
                    "flex w-full items-center px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--background)]",
                    value === item && "bg-[var(--background)] font-medium",
                  )}
                >
                  <span className="min-w-0 truncate">{item}</span>
                </button>
              ))
            )}
            <div className="border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full px-3 py-2.5 text-left text-[13px] text-[var(--info)] hover:bg-[var(--background)]"
              >
                + Add new {label.toLowerCase()}
              </button>
            </div>
          </>
        ) : (
          <div className="p-3">
            <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">New {label.toLowerCase()}</p>
            <input
              type={mode === "email" ? "email" : "tel"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="mb-2 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[13px] focus:border-[var(--text-secondary)] focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="button" variant="neutral" size="small" className="flex-1" onClick={() => setAdding(false)}>
                Back
              </Button>
              <Button
                type="button"
                variant="brand"
                size="small"
                className="flex-1"
                disabled={!draft.trim()}
                onClick={commitNew}
              >
                Save & select
              </Button>
            </div>
          </div>
        )}
      </DetachedDropdown>

      <Button
        variant="neutral"
        size="medium"
        className="w-full"
        onClick={() => void onSend()}
        isLoading={isSending}
        disabled={!value.trim() || isSending}
      >
        {isSending ? "Sending…" : "Send test"}
      </Button>

    </div>
  );
}
