import type { Project } from "@/types/project";
import type { GeneratedCampaign } from "@/types/campaign";

export const PAGES_BOOTSTRAP_KEY = "ams_pages_bootstrap_v1";

export interface PagesBootstrapPayload {
  projects: Project[];
  generatedCampaign: GeneratedCampaign;
}

function reviveProject(p: Project): Project {
  return {
    ...p,
    createdAt: new Date(p.createdAt as unknown as string | number | Date),
    updatedAt: new Date(p.updatedAt as unknown as string | number | Date),
  };
}

function reviveCampaign(c: GeneratedCampaign): GeneratedCampaign {
  return {
    ...c,
    createdAt: new Date(c.createdAt as unknown as string | number | Date),
    updatedAt: new Date(c.updatedAt as unknown as string | number | Date),
  };
}

/** Read and remove one-shot bootstrap payload (static Pages full navigation after campaign create). */
export function consumePagesBootstrap(): PagesBootstrapPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAGES_BOOTSTRAP_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PAGES_BOOTSTRAP_KEY);
    const data = JSON.parse(raw) as PagesBootstrapPayload;
    if (!data?.projects || !data?.generatedCampaign) return null;
    return {
      projects: data.projects.map(reviveProject),
      generatedCampaign: reviveCampaign(data.generatedCampaign),
    };
  } catch {
    return null;
  }
}
