"use client";

import { cn } from "@/lib/cn";

export function LanguageSidebarSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Language Variants
        </p>
        <div className="space-y-2">
          {[
            { code: "en-US", name: "English (US)", status: "Primary", flag: "🇺🇸" },
            { code: "es-MX", name: "Spanish (MX)", status: "Complete", flag: "🇲🇽" },
            { code: "fr-FR", name: "French (FR)", status: "Draft", flag: "🇫🇷" },
          ].map((lang) => (
            <div
              key={lang.code}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-active)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-[14px]">{lang.flag}</span>
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{lang.name}</p>
                  <p className="text-[13px] text-[var(--text-muted)]">{lang.code}</p>
                </div>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[13px] font-medium",
                  lang.status === "Primary" && "bg-blue-50 text-blue-600",
                  lang.status === "Complete" && "bg-emerald-50 text-emerald-600",
                  lang.status === "Draft" && "bg-amber-50 text-amber-600",
                )}
              >
                {lang.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[13px] text-[var(--text-muted)] font-medium hover:border-[#DDD] hover:text-neutral-500 transition-all"
      >
        + Add language variant
      </button>

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Personalization Tokens
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["{{first_name}}", "{{company}}", "{{product}}"].map((token) => (
            <span
              key={token}
              className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[13px] font-mono cursor-pointer hover:bg-orange-100 transition-colors border border-orange-100"
            >
              {token}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
