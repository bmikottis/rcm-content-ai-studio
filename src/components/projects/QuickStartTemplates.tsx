"use client";

import { Template, Channel } from "@/types/project";
import { cn } from "@/lib/cn";

interface QuickStartTemplatesProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  className?: string;
}

const channelLabels: Record<Channel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  social: "Social",
};

const channelIcons: Record<Channel, React.FC<{ className?: string }>> = {
  email: EmailIcon,
  sms: MessageIcon,
  whatsapp: WhatsAppIcon,
  social: ShareIcon,
};

export function QuickStartTemplates({ templates, onSelect, className }: QuickStartTemplatesProps) {
  return (
    <div className={cn("bg-[var(--surface)] border border-[var(--border)] rounded", className)}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <TemplateIcon className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Quick Start</h3>
        </div>
        <button className="text-[13px] text-[#0F8EFF] hover:text-[#014486] transition-colors">
          Browse all templates
        </button>
      </div>
      
      {/* Card Body - Horizontal scroll on mobile, grid on desktop */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {templates.map((template) => {
            const primaryChannel = template.channels[0];
            const ChannelIcon = channelIcons[primaryChannel] || EmailIcon;
            
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group text-left p-3 rounded border border-[var(--border)] bg-[var(--surface)] hover:border-[#0F8EFF] hover:bg-[#FAFAFA] transition-all"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded bg-[#EBF5FE] flex items-center justify-center mb-2">
                  <ChannelIcon className="w-4 h-4 text-[#0F8EFF]" />
                </div>
                
                {/* Title */}
                <h4 className="text-[13px] font-bold text-[var(--text-primary)] mb-0.5 group-hover:text-[#0F8EFF] transition-colors line-clamp-1">
                  {template.name}
                </h4>
                
                {/* Channels */}
                <p className="text-[13px] text-[var(--text-muted)] line-clamp-1">
                  {template.channels.map(c => channelLabels[c]).join(", ")}
                </p>
                
                {/* Time estimate */}
                {template.estimatedTime && (
                  <p className="text-[13px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {template.estimatedTime}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
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

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
