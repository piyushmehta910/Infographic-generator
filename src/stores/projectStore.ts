import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Project } from "@/lib/types";

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        projects: [],
        currentProject: null,
        isLoading: false,

        setProjects: (projects) => set({ projects }),

        addProject: (project) =>
          set((state) => ({
            projects: [project, ...state.projects],
          })),

        updateProject: (id, updates) =>
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id
                ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                : p,
            ),
            currentProject:
              state.currentProject?.id === id
                ? {
                    ...state.currentProject,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  }
                : state.currentProject,
          })),

        deleteProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject:
              state.currentProject?.id === id ? null : state.currentProject,
          })),

        setCurrentProject: (project) => set({ currentProject: project }),

        setLoading: (loading) => set({ isLoading: loading }),

        getProject: (id) => get().projects.find((p) => p.id === id),
      }),
      {
        name: "project-store",
        partialize: (state) => ({
          projects: state.projects,
        }),
      },
    ),
    { name: "project-store" },
  ),
);
