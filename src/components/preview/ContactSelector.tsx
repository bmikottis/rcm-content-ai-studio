"use client";

import { useRef, useState } from "react";
import { mockTestContacts } from "@/data/mock-contacts";
import { DetachedDropdown } from "./DetachedDropdown";
import { cn } from "@/lib/cn";

interface ContactSelectorProps {
  selected: string;
  onChange: (contactId: string) => void;
  className?: string;
  /** Hide the built-in "Personalize as" label when the parent already provides one. */
  omitLabel?: boolean;
}

export function ContactSelector({
  selected,
  onChange,
  className,
  omitLabel = false,
}: ContactSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedContact = mockTestContacts.find((c) => c.id === selected);

  return (
    <div className={cn("relative min-w-0", className)}>
      {!omitLabel && (
        <label className="mb-2 block text-body-sm text-[var(--text-muted)]">Personalize as</label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-2 px-2.5",
          "rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-left",
          "text-[13px] font-medium text-[var(--text-primary)]",
          "transition-colors hover:border-[var(--text-muted)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-primary)]">
          {selectedContact?.firstName} {selectedContact?.lastName}
        </span>
        <span className="shrink-0 text-[var(--text-muted)] text-[13px]">▾</span>
      </button>

      <DetachedDropdown open={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} maxHeight={280}>
        {mockTestContacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => {
              onChange(contact.id);
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full min-w-0 items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]",
              selected === contact.id && "bg-[var(--surface-hover)]",
            )}
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                {selected === contact.id && "● "}
                {contact.firstName} {contact.lastName}
              </div>
              <div className="truncate text-[13px] text-[var(--text-muted)]">{contact.segment}</div>
            </div>
          </button>
        ))}
        <div className="border-t border-[var(--border)]">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-[13px] text-[var(--accent)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            + Add test contact
          </button>
        </div>
      </DetachedDropdown>

    </div>
  );
}
