"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface UploadBriefButtonProps {
  onClick: () => void;
  className?: string;
}

export function UploadBriefButton({ onClick, className }: UploadBriefButtonProps) {
  return (
    <Button
      variant="neutral"
      size="medium"
      onClick={onClick}
      leftIcon={<PaperclipIcon className="w-4 h-4" />}
      className={className}
    >
      Upload Brief
    </Button>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
