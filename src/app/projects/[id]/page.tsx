"use client";

import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { useProjectsStore } from "@/stores/projects";
import { useCampaignCreationStore } from "@/stores/campaign-creation";
import { useConversationStore } from "@/stores/conversation";
import { usePreviewStore } from "@/stores/preview";
import { SimpleCanvas, AgentCommandBar, CanvasExplorer, WorkspaceTopActions } from "@/components/workspace";
import { CanvasHeader } from "@/components/canvas/CanvasHeader";
import { useWorkspaceStore } from "@/stores/workspace";
import { useSimpleCanvasStore, simulateInitialGeneration } from "@/stores/simple-canvas";
import { buildCardTouchpoints } from "@/lib/card-to-preview";
import { PreviewView } from "@/components/preview/PreviewView";
import { VibeEditor } from "@/components/canvas/VibeEditor";
import { ApprovalModal } from "@/components/approval/ApprovalModal";
import { ApprovalThread } from "@/components/approval/ApprovalThread";
import { CampaignInfoPanel } from "@/components/campaign/CampaignInfoPanel";
import { AnchoredAgentPanel } from "@/components/workspace/AnchoredAgentPanel";
import { ChannelInspector } from "@/components/workspace/ChannelInspector";
import { useToolsStore } from "@/stores/tools";
import { usePublishStore } from "@/stores/publish";

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { setProjectId, setTitle, loadMockContent } = useCanvasStore();
  const { projects } = useProjectsStore();
  const { generatedCampaign } = useCampaignCreationStore();
  const { addMessage, clearMessages } = useConversationStore();
  const { viewMode, setViewMode } = usePreviewStore();
  const { loadWorkspaceData } = useWorkspaceStore();
  const { selectedCardId, selectedCardIds, cards, selectCard } = useSimpleCanvasStore();
  const showContextPanel = useToolsStore((s) => s.showContextPanel);
  const { isPublishing, publishLabel } = usePublishStore();
  const conversationInitialized = useRef(false);
  const generationStartedRef = useRef(false);
  // selectedChannelId now holds a SimpleCanvas card ID (e.g. "email-card")
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Global Cmd/Ctrl+Z undo handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (!(e.target as HTMLElement).matches("input,textarea,[contenteditable]")) {
          e.preventDefault();
          useSimpleCanvasStore.getState().undo();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Build preview touchpoints directly from simple-canvas cards
  const cardTouchpoints = useMemo(
    () => buildCardTouchpoints(cards),
    [cards],
  );

  // Sync: canvas card selection → selectedChannelId (card ID)
  useEffect(() => {
    if (viewMode === "canvas") {
      if (selectedCardId && selectedCardId !== selectedChannelId) {
        setSelectedChannelId(selectedCardId);
      } else if (!selectedCardId && selectedChannelId) {
        setSelectedChannelId(null);
      }
    }
  }, [selectedCardId, viewMode]);

  // Derive selected channel IDs for multi-block preview
  const selectedChannelIds = useMemo(() => {
    if (selectedCardIds.length > 1) return selectedCardIds;
    if (selectedChannelId) return [selectedChannelId];
    return [];
  }, [selectedCardIds, selectedChannelId]);

  // Sync: when switching TO canvas, select matching card
  useEffect(() => {
    if (viewMode === "canvas" && selectedChannelId && selectedChannelId !== selectedCardId) {
      selectCard(selectedChannelId);
    }
  }, [viewMode, selectedChannelId]);

  const project = useMemo(() => 
    projects.find(p => p.id === projectId), 
    [projects, projectId]
  );

  const campaign = useMemo(() => {
    if (generatedCampaign?.id === projectId) return generatedCampaign;
    // On static Pages hosts, new campaigns always land at /projects/campaign-latest
    if (projectId === "campaign-latest" && generatedCampaign) return generatedCampaign;
    return null;
  }, [generatedCampaign, projectId]);

  useEffect(() => {
    setProjectId(projectId);
    
    if (campaign) {
      setTitle(campaign.name);
    } else if (project) {
      setTitle(project.title);
    } else {
      setTitle("New Project");
    }
    
    loadMockContent();
    loadWorkspaceData();
  }, [projectId, campaign, project, setProjectId, setTitle, loadMockContent, loadWorkspaceData]);

  // Sync canvas project id before paint; reload simple-canvas when switching projects.
  // Runs before the new-campaign layout effect below so we still see sessionStorage flag.
  useLayoutEffect(() => {
    useCanvasStore.getState().setProjectId(projectId);
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("ams_new_campaign")) {
        return;
      }
    } catch {
      /* private mode */
    }
    useSimpleCanvasStore.getState().reset();
    useSimpleCanvasStore.getState().loadInitialData();
  }, [projectId]);

  useEffect(() => {
    if (campaign && !conversationInitialized.current) {
      conversationInitialized.current = true;
      clearMessages();
      
      addMessage({
        role: "user",
        content: campaign.prompt,
        status: "complete",
        metadata: { type: "prompt" },
      });

      addMessage({
        role: "assistant",
        content: `I've generated your "${campaign.name}" campaign with content for ${campaign.content.map(c => c.channel).join(", ")}. The content follows your brand guidelines and targets ${campaign.plan.targetAudience}. You can ask me to refine the tone, adjust copy, or update specific channels.`,
        status: "complete",
        metadata: {
          type: "update",
          affectedChannels: campaign.content.map(c => c.channel),
        },
      });
    }
  }, [campaign, addMessage, clearMessages]);

  // Trigger generation animation when opening from a new campaign creation.
  // useLayoutEffect ensures store is populated before SimpleCanvas's useEffect fires.
  useLayoutEffect(() => {
    if (generationStartedRef.current) return;
    try {
      const raw = sessionStorage.getItem("ams_new_campaign");
      if (!raw) return;
      sessionStorage.removeItem("ams_new_campaign");
      generationStartedRef.current = true;

      useSimpleCanvasStore.getState().reset();
      const cleanup = simulateInitialGeneration();
      return cleanup;
    } catch {
      /* private mode */
    }
  }, []);

  const isPharmaEmailPrototype = projectId === "proj-pharma-email";

  useEffect(() => {
    if (isPharmaEmailPrototype) setViewMode("canvas");
  }, [isPharmaEmailPrototype, setViewMode]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] relative">
      {/* Main row: canvas area + agent panel side-by-side */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas / preview area — shrinks when agent panel is open */}
        <div
          data-workspace-canvas-area
          className="relative flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <AnimatePresence mode="wait">
            {viewMode === "canvas" ? (
              <motion.div
                key="canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex"
              >
                <SimpleCanvas className="min-w-0 flex-1" />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 min-w-0 overflow-hidden"
              >
                <PreviewView
                  selectedChannelId={selectedChannelId}
                  selectedChannelIds={selectedChannelIds}
                  onSelectChannel={setSelectedChannelId}
                  touchpoints={cardTouchpoints}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Publishing overlay — covers only the canvas area */}
          <AnimatePresence>
            {isPublishing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-[2px]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-xl border border-[#DDD]"
                >
                  <svg className="w-8 h-8 animate-spin text-[#0F8EFF]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-neutral-900">Publishing...</p>
                    {publishLabel && (
                      <p className="text-[13px] text-[#7A7A7A] mt-1 max-w-[260px] truncate">{publishLabel}</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left panel: unified explorer (always visible, drives preview selection too) */}
          <CanvasExplorer
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
          />

          {/* Top-right: account, Share, Publish */}
          <WorkspaceTopActions />

          {!isPharmaEmailPrototype && <CanvasHeader />}
          <AgentCommandBar />

          {/* Right panel: channel inspector (canvas only) */}
          {viewMode === "canvas" && <ChannelInspector />}
        </div>

        {!isPharmaEmailPrototype && <AnchoredAgentPanel />}
      </div>

      {viewMode === "canvas" && campaign && !isPharmaEmailPrototype && (
        <CampaignInfoPanel campaign={campaign} />
      )}

      {!isPharmaEmailPrototype && (
        <>
          <VibeEditor />
          <ApprovalModal />
          <ApprovalThread />
        </>
      )}

    </div>
  );
}
