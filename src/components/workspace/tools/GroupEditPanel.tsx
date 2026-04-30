"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { SidebarDrilldownHeader } from "@/components/workspace/sidebar/SidebarDrilldownHeader";
import { cn } from "@/lib/cn";

const toneAttributes = [
  { id: "premium", label: "Premium", icon: "✨" },
  { id: "casual", label: "Casual", icon: "😊" },
  { id: "urgent", label: "Urgent", icon: "⚡" },
  { id: "friendly", label: "Friendly", icon: "💬" },
  { id: "professional", label: "Professional", icon: "💼" },
];

export function GroupEditPanel() {
  const { pendingGroupEdit, applyGroupEdit, cancelGroupEdit, isProcessing } = useToolsStore();
  const { groups } = useWorkspaceStore();
  const [toneAdjustments, setToneAdjustments] = useState<Record<string, number>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const group = groups.find(g => g.id === pendingGroupEdit?.groupId);

  if (!group || !pendingGroupEdit) {
    return (
      <div className="p-4 text-center">
        <p className="text-[13px] text-neutral-500">Select a group to edit</p>
      </div>
    );
  }

  const handleToneChange = (attribute: string, value: number) => {
    setToneAdjustments(prev => ({ ...prev, [attribute]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarDrilldownHeader title={group.name} onBack={() => cancelGroupEdit()} />
      <div className="shrink-0 border-b border-[#DDD] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: group.color }} />
          <p className="text-[13px] text-neutral-500">
            Editing {group.channels.length} channel variant{group.channels.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tone sliders */}
      {pendingGroupEdit.action === "tone" && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Tone Adjustments
            </p>
            <p className="text-[13px] text-neutral-500 mb-4">
              Changes will cascade across all variants in this group
            </p>
          </div>

          {toneAttributes.map(attr => (
            <div key={attr.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                  <span>{attr.icon}</span>
                  {attr.label}
                </label>
                <span className="text-[13px] text-[#7A7A7A] tabular-nums">
                  {(toneAdjustments[attr.id] || 0) > 0 ? "+" : ""}
                  {toneAdjustments[attr.id] || 0}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={toneAdjustments[attr.id] || 0}
                onChange={(e) => handleToneChange(attr.id, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full bg-neutral-200 appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          ))}

          {/* Preview toggle */}
          <div className="pt-4 border-t border-[#DDD]">
            <label className="flex items-center gap-3 cursor-pointer">
              <div 
                className={cn(
                  "w-10 h-6 rounded-full p-0.5 transition-colors",
                  previewMode ? "bg-neutral-900" : "bg-neutral-200"
                )}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <motion.div 
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ x: previewMode ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
              <span className="text-[13px] text-neutral-600">Live preview</span>
            </label>
          </div>

          {/* Affected channels */}
          <div className="pt-4">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Will update
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.channels.map(ch => (
                <span 
                  key={ch.id}
                  className="px-2 py-1 rounded-full bg-neutral-100 text-[13px] font-medium text-neutral-600 capitalize"
                >
                  {ch.channel}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personalization editing */}
      {pendingGroupEdit.action === "personalization" && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Personalization Tokens
            </p>
          </div>

          <TokenEditor token="{{first_name}}" usage={3} />
          <TokenEditor token="{{company}}" usage={1} />
          <TokenEditor token="{{last_purchase}}" usage={0} isNew />

          <button className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-[#DDD] text-[13px] text-neutral-500 hover:border-[#DDD] hover:text-neutral-600 transition-colors">
            + Add token
          </button>
        </div>
      )}

      {/* Regenerate mode */}
      {pendingGroupEdit.action === "regenerate" && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-3">
              <span className="text-lg">✨</span>
              <div>
                <p className="text-[13px] font-medium text-amber-900">Regenerate all variants</p>
                <p className="text-[13px] text-amber-700 mt-1">
                  This will use AI to create new content variations while maintaining your brand guidelines and personalization rules.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Additional guidance (optional)
            </p>
            <textarea
              placeholder="Make it more conversational, focus on sustainability..."
              className="w-full h-24 px-3 py-2 rounded-lg border border-[#DDD] text-[13px] resize-none focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="keep-structure" className="rounded" defaultChecked />
            <label htmlFor="keep-structure" className="text-[13px] text-neutral-600">
              Keep existing structure
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="preserve-tokens" className="rounded" defaultChecked />
            <label htmlFor="preserve-tokens" className="text-[13px] text-neutral-600">
              Preserve personalization tokens
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-[#DDD] space-y-2">
        <button
          onClick={applyGroupEdit}
          disabled={isProcessing}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all",
            "bg-neutral-900 text-white hover:bg-neutral-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying changes...
            </>
          ) : (
            <>Apply to all variants</>
          )}
        </button>
        <button
          onClick={cancelGroupEdit}
          disabled={isProcessing}
          className="w-full py-2 px-4 rounded-lg text-[13px] text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TokenEditor({ token, usage, isNew }: { token: string; usage: number; isNew?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[#DDD] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <code className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[13px] font-mono">
            {token}
          </code>
          {isNew && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[11px] font-medium">
              NEW
            </span>
          )}
        </div>
        <span className="text-[13px] text-[#7A7A7A]">
          {usage > 0 ? `${usage} uses` : "Not used"}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-[#DDD] pt-3 space-y-2">
          <div>
            <label className="text-[13px] text-neutral-500">Default value</label>
            <input
              type="text"
              placeholder="Enter default..."
              className="w-full mt-1 px-2 py-1.5 rounded border border-[#DDD] text-[13px]"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-1.5 rounded bg-neutral-100 text-[13px] text-neutral-600 hover:bg-neutral-200">
              Remove
            </button>
            <button className="flex-1 py-1.5 rounded bg-neutral-900 text-[13px] text-white hover:bg-neutral-800">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
