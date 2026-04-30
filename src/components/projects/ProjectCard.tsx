"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Project } from "@/types/project";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/data/mock-projects";
import { cn } from "@/lib/cn";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

const gradients = [
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
];

export function ProjectCard({ project, className }: ProjectCardProps) {
  const gradientIndex = project.id.charCodeAt(project.id.length - 1) % gradients.length;

  return (
    <Link href={`/projects/${project.id}`} target="_blank">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
          "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
          "overflow-hidden cursor-pointer transition-shadow duration-200",
          className
        )}
      >
        {/* Thumbnail */}
        <div
          className="aspect-video w-full"
          style={{ background: gradients[gradientIndex] }}
        />
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-h3 text-[var(--text-primary)] mb-1 truncate">
            {project.title}
          </h3>
          <p className="text-body-sm text-[var(--text-muted)] mb-3">
            Updated {formatRelativeTime(project.updatedAt)}
          </p>
          <StatusBadge status={project.status} />
        </div>
      </motion.div>
    </Link>
  );
}
