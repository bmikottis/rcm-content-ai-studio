"use client";

import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { AtomicBlock, ContentGroup } from "@/types/workspace";
import { BlockAttachmentsPanel } from "@/components/workspace/BlockChannelAttachments";
import { cn } from "@/lib/cn";

export function SelectInspectPanel() {
  const { selectedIds, groups, atomicBlocks } = useWorkspaceStore();
  const { setActiveTool, startImageEdit, startGroupEdit, openInspectorBlockDetail, openInspectorGroupDetail } = useToolsStore();

  if (selectedIds.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-active)] flex items-center justify-center mx-auto mb-3">
          <SelectIcon className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium">Nothing selected</p>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">Click an item to inspect</p>
      </div>
    );
  }

  const selectedGroup = groups.find(g => selectedIds.includes(g.id));
  const selectedBlock = atomicBlocks.find(b => selectedIds.includes(b.id));

  if (selectedGroup) {
    return <GroupInspector group={selectedGroup} />;
  }

  if (selectedBlock) {
    return <BlockInspector block={selectedBlock} />;
  }

  // Multiple selection
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <span className="text-[14px] font-semibold text-blue-600">{selectedIds.length}</span>
        </div>
        <div>
          <p className="text-[13px] font-medium text-[var(--text-primary)]">Multiple items</p>
          <p className="text-[13px] text-[var(--text-secondary)]">Selected for batch edit</p>
        </div>
      </div>

      <div className="space-y-2">
        <ActionButton icon={<GroupEditIcon />} label="Apply group edit" onClick={() => setActiveTool("group-edit")} />
        <ActionButton icon={<ToneIcon />} label="Adjust tone across all" onClick={() => setActiveTool("group-edit")} />
        <ActionButton icon={<LinkIcon />} label="Link selected items" onClick={() => setActiveTool("link")} />
      </div>
    </div>
  );
}

function GroupInspector({ group }: { group: ContentGroup }) {
  const { atomicBlocks, connections } = useWorkspaceStore();
  const { startGroupEdit, openInspectorGroupDetail } = useToolsStore();

  const groupConnections = connections.filter(
    (c) =>
      c.sourceId === group.id ||
      c.targetId === group.id ||
      group.channels.some((ch) => ch.id === c.sourceId || ch.id === c.targetId),
  );

  const linkedBlocks = atomicBlocks.filter(b => 
    b.linkedTo?.some(id => group.channels.some(c => c.id === id))
  );

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => openInspectorGroupDetail(group.id)}
        className="w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Edit properties
      </button>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${group.color}20` }}
        >
          <div className="w-4 h-4 rounded" style={{ backgroundColor: group.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{group.name}</h3>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{group.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatBadge label="Channels" value={group.channels.length.toString()} color="blue" />
        <StatBadge label="Linked content" value={linkedBlocks.length.toString()} color="purple" />
        <StatBadge label="Connections" value={groupConnections.length.toString()} color="emerald" />
        <StatBadge 
          label="Status" 
          value={group.channels.every(c => c.status === "ready") ? "Ready" : "Draft"} 
          color={group.channels.every(c => c.status === "ready") ? "emerald" : "amber"} 
        />
      </div>

      {/* Channels */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Channels</p>
        <div className="space-y-1.5">
          {group.channels.map(channel => (
            <div 
              key={channel.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-active)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ChannelIcon channel={channel.channel} />
                <span className="text-[13px] font-medium text-[var(--text-secondary)] capitalize">{channel.channel}</span>
              </div>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[11px] font-medium capitalize",
                channel.status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"
              )}>
                {channel.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-[var(--border)] space-y-2">
        <ActionButton 
          icon={<ToneIcon />} 
          label="Adjust tone across group" 
          onClick={() => startGroupEdit(group.id, "tone")} 
        />
        <ActionButton 
          icon={<TokenIcon />} 
          label="Edit personalization" 
          onClick={() => startGroupEdit(group.id, "personalization")} 
        />
        <ActionButton 
          icon={<RegenerateIcon />} 
          label="Regenerate all variants" 
          onClick={() => startGroupEdit(group.id, "regenerate")} 
          variant="primary"
        />
      </div>
    </div>
  );
}

function BlockInspector({ block }: { block: AtomicBlock }) {
  const { startImageEdit, setActiveTool, openInspectorBlockDetail } = useToolsStore();

  const blockTypeConfig: Record<
    string,
    { label: string; badgeClass: string }
  > = {
    image: { label: "Image Asset", badgeClass: "bg-purple-100 text-purple-700" },
    headline: { label: "Headline", badgeClass: "bg-blue-100 text-blue-700" },
    body: { label: "Body Text", badgeClass: "bg-slate-100 text-slate-700" },
    cta: { label: "Call to Action", badgeClass: "bg-emerald-100 text-emerald-700" },
    disclaimer: { label: "Disclaimer", badgeClass: "bg-amber-100 text-amber-700" },
    token: { label: "Token", badgeClass: "bg-orange-100 text-orange-700" },
    language: { label: "Language", badgeClass: "bg-cyan-100 text-cyan-700" },
  };

  const config = blockTypeConfig[block.type];

  return (
    <div className="p-4 space-y-4">
      <button
        type="button"
        onClick={() => openInspectorBlockDetail(block.id)}
        className="w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Edit properties
      </button>

      {/* Header */}
      <div>
        <span
          className={cn(
            "mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
            config.badgeClass,
          )}
        >
          {config.label}
        </span>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{block.content}</h3>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Attached to</p>
        <BlockAttachmentsPanel block={block} variant="inline" />
      </div>

      {/* Type-specific actions */}
      <div className="pt-2 border-t border-[var(--border)] space-y-2">
        {block.type === "image" && (
          <>
            <ActionButton icon={<ReplaceIcon />} label="Replace image" onClick={() => startImageEdit(block.id, "replace")} />
            <ActionButton icon={<CropIcon />} label="Adjust crop & focal" onClick={() => startImageEdit(block.id, "crop")} />
            <ActionButton icon={<RegenerateIcon />} label="Regenerate with AI" onClick={() => startImageEdit(block.id, "regenerate")} />
            <ActionButton icon={<PropagateIcon />} label="Propagate to all linked" onClick={() => startImageEdit(block.id, "propagate")} variant="primary" />
          </>
        )}

        {(block.type === "headline" || block.type === "body") && (
          <>
            <ActionButton icon={<EditIcon />} label="Edit text" onClick={() => openInspectorBlockDetail(block.id)} />
            <ActionButton icon={<ToneIcon />} label="Adjust tone" onClick={() => setActiveTool("group-edit")} />
            <ActionButton icon={<PropagateIcon />} label="Sync to linked" variant="primary" />
          </>
        )}

        {block.type === "cta" && (
          <>
            <ActionButton icon={<EditIcon />} label="Edit CTA text" />
            <ActionButton icon={<LinkIcon />} label="Update link URL" />
            <ActionButton icon={<PropagateIcon />} label="Sync across variants" variant="primary" />
          </>
        )}

        {block.type === "token" && (
          <>
            <ActionButton icon={<TokenIcon />} label="Configure token" onClick={() => setActiveTool("language")} />
            <ActionButton icon={<PropagateIcon />} label="Apply to more channels" />
          </>
        )}

        <ActionButton icon={<UnlinkIcon />} label="Unlink from channels" variant="danger" />
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={cn("p-2 rounded-lg", colorClasses[color] || colorClasses.blue)}>
      <p className="text-[16px] font-semibold">{value}</p>
      <p className="text-[13px] opacity-70">{label}</p>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
}

function ActionButton({ icon, label, onClick, variant = "default" }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
        variant === "default" && "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)]",
        variant === "primary" && "bg-neutral-900 text-white hover:bg-neutral-800",
        variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100"
      )}
    >
      <span className={cn(
        "w-4 h-4",
        variant === "primary" && "text-white",
        variant === "danger" && "text-red-500"
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, React.ReactNode> = {
    email: <EmailIcon />,
    sms: <SMSIcon />,
    whatsapp: <WhatsAppIcon />,
    rcs: <RCSIcon />,
    web: <WebIcon />,
  };
  return <span className="w-4 h-4 text-[var(--text-secondary)]">{icons[channel]}</span>;
}

// Icons
function SelectIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>;
}

function GroupEditIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function ToneIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>;
}

function LinkIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
}

function UnlinkIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
}

function TokenIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9Z" /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" /></svg>;
}

function RegenerateIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>;
}

function ReplaceIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>;
}

function CropIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></svg>;
}

function PropagateIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}

function EditIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function EmailIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>; }
function SMSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function WhatsAppIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>; }
function RCSIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function WebIcon() { return <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }
