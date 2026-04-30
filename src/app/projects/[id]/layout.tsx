import { mockProjects } from "@/data/mock-projects";

export const CAMPAIGN_LATEST_SLUG = "campaign-latest";

export function generateStaticParams() {
  return [
    ...mockProjects.map((p) => ({ id: p.id })),
    { id: CAMPAIGN_LATEST_SLUG },
  ];
}

export default function ProjectCanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="canvas-app h-screen flex flex-col">
      {children}
    </div>
  );
}
