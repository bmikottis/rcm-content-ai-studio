"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface SendTestProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSend: () => void;
  isSending: boolean;
  success: boolean;
  previewInfo?: string;
  className?: string;
  /** Use vertical layout so email + button never overflow a narrow column (e.g. floating preview settings). */
  stacked?: boolean;
}

export function SendTest({
  email,
  onEmailChange,
  onSend,
  isSending,
  success,
  previewInfo,
  className,
  stacked = false,
}: SendTestProps) {
  if (success) {
    return (
      <div className={cn("bg-green-50 rounded-[var(--radius-lg)] p-4", className)}>
        <div className="flex items-center gap-2 text-[var(--success)] mb-2">
          <span>✓</span>
          <span className="font-medium">Test sent successfully</span>
        </div>
        <p className="text-body-sm text-[var(--text-secondary)]">
          Check {email} for the test message.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-body-sm text-[var(--text-muted)] mb-2">
        Send Test
      </label>
      
      <div
        className={cn(
          "flex min-w-0 gap-2",
          stacked
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-stretch",
        )}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your.email@company.com"
          className={cn(
            "h-12 min-w-0 w-full px-4 bg-[var(--background)] rounded-[var(--radius-md)]",
            "border border-[var(--border)] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:border-[var(--text-secondary)]",
            !stacked && "sm:flex-1",
          )}
        />
        <Button
          variant="brand"
          size="medium"
          onClick={onSend}
          isLoading={isSending}
          disabled={!email.trim() || isSending}
          className={cn("w-full shrink-0", !stacked && "sm:w-auto")}
        >
          {isSending ? "Sending..." : "Send Test"}
        </Button>
      </div>

      {previewInfo && (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
          Preview as: {previewInfo}
        </p>
      )}
    </div>
  );
}
