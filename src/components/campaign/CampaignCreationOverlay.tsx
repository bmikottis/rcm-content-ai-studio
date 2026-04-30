"use client";

import { useEffect, useRef } from "react";
import { useCampaignCreationStore } from "@/stores/campaign-creation";
import { useProjectsStore } from "@/stores/projects";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { PAGES_BOOTSTRAP_KEY } from "@/lib/pages-bootstrap";

export function CampaignCreationOverlay() {
  const hasNavigatedRef = useRef(false);

  const {
    isCreating,
    currentPhase,
    pendingCampaignId,
    pendingPrompt,
    pendingName,
    reset,
  } = useCampaignCreationStore();

  // Navigate to canvas as soon as creation starts and we have a campaign ID.
  // The canvas page will run its own generation animation via sessionStorage.
  useEffect(() => {
    if (!isCreating || hasNavigatedRef.current || !pendingCampaignId) return;

    hasNavigatedRef.current = true;

    const campaignId = pendingCampaignId;
    const campaignName = pendingName ?? "New Campaign";
    const prompt = pendingPrompt ?? "";

    // Clear the simple canvas for fresh generation
    useSimpleCanvasStore.getState().reset();

    const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

    try {
      sessionStorage.setItem("ams_new_campaign", JSON.stringify({
        prompt,
        campaignName,
        campaignId,
      }));

      if (basePath) {
        sessionStorage.setItem(
          PAGES_BOOTSTRAP_KEY,
          JSON.stringify({
            projects: useProjectsStore.getState().projects,
          }),
        );
      }
    } catch {
      /* private mode / quota */
    }

    const url = basePath
      ? `${basePath}/projects/campaign-latest`
      : `/projects/${campaignId}`;

    window.open(url, "_blank");

    queueMicrotask(() => reset());
  }, [isCreating, pendingCampaignId, pendingPrompt, pendingName, reset]);

  // Reset the ref when creation finishes
  useEffect(() => {
    if (!isCreating) {
      hasNavigatedRef.current = false;
    }
  }, [isCreating]);

  return null;
}
