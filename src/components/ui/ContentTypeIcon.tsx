"use client";

import { cn } from "@/lib/cn";

export type ContentType =
  | "image"
  | "headline"
  | "body"
  | "cta"
  | "divider"
  | "document"
  | "brief"
  | "link"
  | "prompt"
  | "email"
  | "sms"
  | "whatsapp";

type IconSize = "sm" | "md" | "lg";

interface ContentTypeIconProps {
  type: ContentType;
  size?: IconSize;
  className?: string;
}

const typeLabels: Record<ContentType, string> = {
  image: "Image",
  headline: "Headline",
  body: "Body",
  cta: "CTA",
  divider: "Divider",
  document: "Document",
  brief: "Brief",
  link: "Link",
  prompt: "Prompt",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const typeConfig: Record<ContentType, { bg: string; text: string }> = {
  image: { bg: "bg-fuchsia-50", text: "text-fuchsia-500" },
  headline: { bg: "bg-violet-50", text: "text-violet-500" },
  body: { bg: "bg-sky-50", text: "text-sky-500" },
  cta: { bg: "bg-emerald-50", text: "text-emerald-500" },
  divider: { bg: "bg-[var(--surface-subtle)]", text: "text-[var(--text-muted)]" },
  email: { bg: "bg-blue-50", text: "text-blue-500" },
  sms: { bg: "bg-emerald-50", text: "text-emerald-600" },
  whatsapp: { bg: "bg-emerald-50", text: "text-emerald-600" },
  document: { bg: "bg-blue-50", text: "text-blue-500" },
  brief: { bg: "bg-orange-50", text: "text-orange-500" },
  link: { bg: "bg-amber-50", text: "text-amber-500" },
  prompt: { bg: "bg-violet-50", text: "text-violet-500" },
};

const iconSizeClass: Record<IconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const typeIcon: Record<ContentType, React.FC<{ className?: string }>> = {
  image: ImageIcon,
  headline: HeadlineIcon,
  body: BodyIcon,
  cta: CtaIcon,
  divider: DividerIcon,
  document: DocumentIcon,
  brief: BriefIcon,
  link: LinkIcon,
  prompt: PromptIcon,
  email: EmailIcon,
  sms: SmsIcon,
  whatsapp: SmsIcon,
};

export function ContentTypeIcon({ type, size = "sm", className }: ContentTypeIconProps) {
  const label = typeLabels[type] ?? typeLabels.body;
  const Icon = typeIcon[type] ?? BodyIcon;

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center text-[var(--text-primary)]", className)}
      role="img"
      aria-label={label}
    >
      <Icon className={iconSizeClass[size]} />
    </div>
  );
}

/* ── Type Tag ── */

export function ContentTypeTag({ type, className }: { type: ContentType; className?: string }) {
  const cfg = typeConfig[type] ?? typeConfig.body;
  return (
    <span
      className={cn(
        "px-1 py-px rounded text-[8px] font-bold tracking-wide flex-shrink-0",
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      {typeLabels[type]}
    </span>
  );
}

/* ── Icons ── */

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function HeadlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 12h12" />
    </svg>
  );
}

function BodyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function CtaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M9 12h6" />
    </svg>
  );
}

function DividerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function BriefIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PromptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
