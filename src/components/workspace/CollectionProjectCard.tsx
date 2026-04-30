"use client";

import { useState } from "react";
import Link from "next/link";
import type { Channel, Project, ProjectStatus } from "@/types/project";
import { cn } from "@/lib/cn";

const gradients = [
  "linear-gradient(145deg, #e8eef5 0%, #c5d4e8 100%)",
  "linear-gradient(145deg, #fdf0e4 0%, #f0c9a8 100%)",
  "linear-gradient(145deg, #e4f4f2 0%, #c8e6e3 100%)",
  "linear-gradient(145deg, #ede4f0 0%, #d4c4dc 100%)",
];

const channelLabel: Record<Channel, string> = {
  email: "EMAIL",
  sms: "SMS",
  whatsapp: "WHATSAPP",
  social: "SOCIAL",
};

const statusLabel: Record<ProjectStatus, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  approved: "APPROVED",
  published: "PUBLISHED",
  archived: "ARCHIVED",
};

function coverSeed(id: string): string {
  return encodeURIComponent(id);
}

interface CollectionProjectCardProps {
  project: Project;
  brandName: string;
  className?: string;
}

export function CollectionProjectCard({ project, brandName, className }: CollectionProjectCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const gradientIndex = project.id.charCodeAt(project.id.length - 1) % gradients.length;
  const primaryChannel = project.channels[0];
  const secondaryChannel = project.channels[1];
  const src =
    project.thumbnail ??
    `https://picsum.photos/seed/${coverSeed(project.id)}/960/720`;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        "shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 bg-neutral-200">
        {!imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: gradients[gradientIndex] }}
            aria-hidden
          />
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
            {channelLabel[primaryChannel]}
          </span>
          {secondaryChannel ? (
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
              {channelLabel[secondaryChannel]}
            </span>
          ) : null}
          <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-900">
            {statusLabel[project.status]}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2.5 pt-10">
          <p className="truncate text-[11px] font-semibold tracking-wide text-white/95">{brandName}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 pt-3.5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[#0F8EFF]">
          {project.title}
        </h3>
        {project.description ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
            {project.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <span
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center rounded-lg py-2.5 text-[13px] font-semibold",
            "bg-neutral-900 text-white transition-colors group-hover:bg-neutral-800",
          )}
        >
          Open workspace
        </span>
      </div>
    </Link>
  );
}
