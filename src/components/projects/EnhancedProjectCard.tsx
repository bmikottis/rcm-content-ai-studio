"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Project, Channel } from "@/types/project";
import { formatRelativeTime } from "@/data/mock-projects";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";

interface EnhancedProjectCardProps {
  project: Project;
  className?: string;
}

const channelIcons: Record<Channel, React.FC<{ className?: string }>> = {
  email: EmailIcon,
  sms: SMSIcon,
  whatsapp: WhatsAppIcon,
  social: SocialIcon,
};

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #00A1E0 0%, #6B5ACC 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

export function EnhancedProjectCard({ project, className }: EnhancedProjectCardProps) {
  const gradientIndex = project.id.charCodeAt(project.id.length - 1) % gradients.length;

  return (
    <Link href={`/projects/${project.id}`} target="_blank">
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group bg-[var(--surface)] rounded-xl border border-[#DDD]/80",
          "shadow-xs hover:shadow-md hover:border-[var(--border)]",
          "overflow-hidden cursor-pointer transition-all duration-200",
          className
        )}
      >
        {/* Thumbnail */}
        <div
          className="aspect-[16/9] w-full relative overflow-hidden"
          style={{ background: gradients[gradientIndex] }}
        >
          {/* Overlay pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)`
            }}
          />
          
          {/* Status badge */}
          <div className="absolute top-2.5 left-2.5">
            <StatusBadge status={project.status} size="md" />
          </div>

          {/* Channel indicators */}
          <div className="absolute bottom-2.5 right-2.5 flex gap-1">
            {project.channels.map((channel) => {
              const Icon = channelIcons[channel];
              return (
                <div
                  key={channel}
                  className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3.5">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-0.5 truncate group-hover:text-[#0F8EFF] transition-colors">
            {project.title}
          </h3>
          
          {project.description && (
            <p className="text-[13px] text-[var(--text-secondary)] mb-3 line-clamp-1">
              {project.description}
            </p>
          )}
          
          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Collaborators */}
              {project.collaborators && project.collaborators.length > 0 && (
                <div className="flex -space-x-1.5">
                  {project.collaborators.slice(0, 3).map((collab) => (
                    <div
                      key={collab.id}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 flex items-center justify-center border-2 border-white text-[8px] font-semibold text-white"
                      title={collab.name}
                    >
                      {collab.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  ))}
                  {project.collaborators.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-[var(--surface-active)] flex items-center justify-center border-2 border-white text-[8px] font-medium text-[var(--text-secondary)]">
                      +{project.collaborators.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Languages */}
              {project.languages && project.languages.length > 1 && (
                <span className="text-[13px] text-[var(--text-muted)] font-medium">
                  {project.languages.length} langs
                </span>
              )}
            </div>

            {/* Timestamp */}
            <span className="text-[13px] text-[var(--text-muted)]">
              {formatRelativeTime(project.updatedAt)}
            </span>
          </div>

          {/* Activity indicators */}
          {(project.commentCount || project.approvalCount) && (
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[var(--border)]">
              {project.commentCount && (
                <span className="flex items-center gap-1 text-[13px] text-[var(--text-muted)]">
                  <CommentIcon className="w-3 h-3" />
                  {project.commentCount}
                </span>
              )}
              {project.approvalCount && (
                <span className="flex items-center gap-1 text-[13px] text-emerald-500 font-medium">
                  <CheckIcon className="w-3 h-3" />
                  {project.approvalCount}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.article>
    </Link>
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    </svg>
  );
}

function SocialIcon({ className }: { className?: string }) {
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

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
