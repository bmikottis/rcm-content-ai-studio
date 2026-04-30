import { create } from "zustand";
import { Project } from "@/types/project";
import { mockProjects } from "@/data/mock-projects";

interface ProjectsStore {
  projects: Project[];
  currentPrompt: string;
  
  setPrompt: (prompt: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: mockProjects,
  currentPrompt: "",
  
  setPrompt: (prompt) => set({ currentPrompt: prompt }),
  
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));
