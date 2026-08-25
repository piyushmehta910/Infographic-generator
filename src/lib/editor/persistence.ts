import { openDB, DBSchema, IDBPDatabase } from "idb";

// ============================================================
// Project persistence (IndexedDB via idb).
// Stores the pipeline context (content, blueprint, HTML) per project.
// ============================================================

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  input: { mode: "text" | "idea"; content: string };
  aspectRatio: string;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
  phase1_content: unknown;
  phase2_blueprint: unknown;
  phase3_html: string;
  thumbnail: string;
}

interface ProjectDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { "by-updated": string };
  };
}

let dbPromise: Promise<IDBPDatabase<ProjectDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ProjectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ProjectDB>("infographic-projects", 1, {
      upgrade(db) {
        const store = db.createObjectStore("projects", { keyPath: "id" });
        store.createIndex("by-updated", "updatedAt");
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", project);
}

export async function loadProject(id: string): Promise<Project | null> {
  const db = await getDB();
  const project = await db.get("projects", id);
  return project ?? null;
}

export async function listProjects(limit = 10): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("projects", "by-updated");
  return all.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("projects", id);
}

export function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
