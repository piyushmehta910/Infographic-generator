import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { MemoryEntry } from "@/services/ai/memory";

// ============================================================
// IndexedDB storage for AI Context Working-Memory.
// Stores context entries locally during the generation process
// and automatically deletes them after generation completes.
// ============================================================

interface AIContextItem {
  id: string; // Session or project ID
  entries: MemoryEntry[];
  updatedAt: number;
}

interface AIContextDB extends DBSchema {
  "context-memory": {
    key: string;
    value: AIContextItem;
    indexes: { "by-updated": number };
  };
}

let dbPromise: Promise<IDBPDatabase<AIContextDB>> | null = null;

function getContextDB(): Promise<IDBPDatabase<AIContextDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser environments."));
  }
  if (!dbPromise) {
    dbPromise = openDB<AIContextDB>("infographic-ai-context", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("context-memory")) {
          const store = db.createObjectStore("context-memory", { keyPath: "id" });
          store.createIndex("by-updated", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

/**
  Saves AI context working-memory entries to IndexedDB for the current session.
 */
export async function saveAIMemory(id: string, entries: MemoryEntry[]): Promise<void> {
  try {
    const db = await getContextDB();
    await db.put("context-memory", {
      id,
      entries: Array.isArray(entries) ? entries : [],
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("IndexedDB saveAIMemory failed:", err);
  }
}

/**
  Retrieves AI context working-memory entries from IndexedDB for a given session.
 */
export async function getAIMemory(id: string): Promise<MemoryEntry[]> {
  try {
    const db = await getContextDB();
    const item = await db.get("context-memory", id);
    return item?.entries ?? [];
  } catch (err) {
    console.warn("IndexedDB getAIMemory failed:", err);
    return [];
  }
}

/**
  Autodeletes/clears AI context memory from IndexedDB for the specified session.
 */
export async function clearAIMemory(id: string): Promise<void> {
  try {
    const db = await getContextDB();
    await db.delete("context-memory", id);
  } catch (err) {
    console.warn("IndexedDB clearAIMemory failed:", err);
  }
}
