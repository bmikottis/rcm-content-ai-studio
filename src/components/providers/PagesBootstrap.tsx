"use client";

import { useLayoutEffect } from "react";
import { consumePagesBootstrap } from "@/lib/pages-bootstrap";
import { useProjectsStore } from "@/stores/projects";
import { useCampaignCreationStore } from "@/stores/campaign-creation";

/**
 * Rehydrates Zustand after a full page load from GitHub Enterprise Pages
 * (see CampaignCreationOverlay hard navigation).
 */
export function PagesBootstrap() {
  useLayoutEffect(() => {
    const payload = consumePagesBootstrap();
    if (!payload) return;

    useProjectsStore.setState({ projects: payload.projects });
    useCampaignCreationStore.getState().setGeneratedCampaign(payload.generatedCampaign);
  }, []);

  return null;
}
