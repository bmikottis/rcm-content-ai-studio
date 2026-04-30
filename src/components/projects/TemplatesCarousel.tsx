"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Template } from "@/types/project";
import { cn } from "@/lib/cn";

interface TemplatesCarouselProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  className?: string;
}

const gradientMap: Record<string, string> = {
  "gradient-blue": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "gradient-purple": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "gradient-green": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "gradient-orange": "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
};

export function TemplatesCarousel({
  templates,
  onSelect,
  className,
}: TemplatesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h2 text-[var(--text-primary)]">Get started with templates</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--background)] transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--background)] transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {templates.map((template) => (
          <motion.button
            key={template.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(template)}
            className="flex-shrink-0 w-[280px] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow bg-[var(--surface)] text-left"
          >
            <div
              className="h-32 w-full"
              style={{ background: gradientMap[template.preview] }}
            />
            <div className="p-4">
              <h3 className="text-h3 text-[var(--text-primary)] mb-1">
                {template.name}
              </h3>
              <p className="text-body-sm text-[var(--text-muted)]">
                {template.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
