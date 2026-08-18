import { openDB, DBSchema, IDBPDatabase } from "idb";

// ============================================================
// Project persistence (IndexedDB via idb).
// Stores the full pipeline context + editable canvas state per
// project. Also supports .igai export/import (full JSON bundle).
// ============================================================

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  input: { mode: "text" | "url" | "image" | "csv"; content: string };
  purpose: string;
  theme: string;
  density: string;
  aspectRatio: string;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
  phase1_content: unknown;
  phase2_blueprint: unknown;
  phase3_html: string;
  canvasState: unknown;
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

// ---- .igai export / import -----------------------------------

export async function exportProjectJSON(project: Project): Promise<void> {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(project.title || "infographic").replace(/[^a-z0-9-_]+/gi, "-")}.igai`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importProjectFromFile(file: File): Promise<Project | null> {
  const text = await file.text();
  try {
    const data = JSON.parse(text) as Partial<Project>;
    if (!data.phase3_html || typeof data.phase3_html !== "string") return null;
    const now = Date.now();
    return {
      id: typeof data.id === "string" && data.id ? data.id : newProjectId(),
      title: typeof data.title === "string" ? data.title : "Imported infographic",
      createdAt: typeof data.createdAt === "number" ? data.createdAt : now,
      updatedAt: now,
      input:
        data.input && typeof data.input === "object"
          ? { mode: data.input.mode ?? "text", content: data.input.content ?? "" }
          : { mode: "text", content: "" },
      purpose: typeof data.purpose === "string" ? data.purpose : "other",
      theme: typeof data.theme === "string" ? data.theme : "modern",
      density: typeof data.density === "string" ? data.density : "balanced",
      aspectRatio: typeof data.aspectRatio === "string" ? data.aspectRatio : "1:1",
      aspectRatioWidth: typeof data.aspectRatioWidth === "number" ? data.aspectRatioWidth : 1080,
      aspectRatioHeight: typeof data.aspectRatioHeight === "number" ? data.aspectRatioHeight : 1080,
      phase1_content: data.phase1_content ?? null,
      phase2_blueprint: data.phase2_blueprint ?? null,
      phase3_html: data.phase3_html,
      canvasState: data.canvasState ?? null,
      thumbnail: typeof data.thumbnail === "string" ? data.thumbnail : "",
    };
  } catch {
    return null;
  }
}

export async function generateThumbnailFromCanvas(canvas: HTMLCanvasElement | null): Promise<string> {
  if (!canvas) return "";
  try {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    return dataUrl.length > 400_000 ? "" : dataUrl;
  } catch {
    return "";
  }
}
