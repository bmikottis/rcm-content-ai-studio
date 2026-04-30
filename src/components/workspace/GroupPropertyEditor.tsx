"use client";

import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import type { ContentGroup } from "@/types/workspace";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";

interface GroupPropertyEditorProps {
  group: ContentGroup;
}

export function GroupPropertyEditor({ group }: GroupPropertyEditorProps) {
  const { updateGroup } = useWorkspaceStore();
  const { closeInspectorDetail } = useToolsStore();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarDrilldownHeader title="Campaign" onBack={closeInspectorDetail} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Name</label>
          <input
            type="text"
            value={group.name}
            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Description</label>
          <textarea
            value={group.description ?? ""}
            onChange={(e) => updateGroup(group.id, { description: e.target.value })}
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Accent</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={group.color}
              onChange={(e) => updateGroup(group.id, { color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)] p-0.5"
            />
            <span className="text-[13px] text-[var(--text-secondary)]">{group.color}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
