"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles, FolderOpen, ImageOff, ExternalLink } from "lucide-react";
import { listProjects, deleteProject, Project } from "@/lib/editor/persistence";
import { APP_NAME } from "@/lib/site";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);

  const refresh = useCallback(async () => {
    setProjects(await listProjects(12));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteProject(id);
      refresh();
    },
    [refresh],
  );

  return (
    <div className="min-h-screen bg-navy-950 text-surface-100 font-body">
      <header className="h-16 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between bg-surface-900/60 backdrop-blur-xl sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40 transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display font-semibold text-white leading-tight">{APP_NAME}</h1>
            <span className="hidden sm:inline text-[11px] text-surface-400 uppercase tracking-wider">Projects</span>
          </div>
        </Link>
        <Link
          href="/generate"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-gradient text-white hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> New infographic
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 mb-8">
          <FolderOpen className="w-5 h-5 text-brand-400" />
          <h2 className="text-xl font-display font-bold text-white">Your infographics</h2>
          <span className="text-xs text-surface-500">stored locally in this browser</span>
        </div>

        {projects === null ? (
          <div className="text-surface-500 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-brand-gradient/10 flex items-center justify-center border border-brand-400/20">
              <ImageOff className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">No infographics yet</h3>
            <p className="text-sm text-surface-400 mb-6">
              Generate your first infographic and it will appear here for quick editing and export.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-brand-gradient text-white hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" /> Create one now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl border border-white/10 bg-surface-900/50 overflow-hidden hover:border-brand-400/40 transition-all"
              >
                <button
                  onClick={() => router.push(`/generate?id=${project.id}`)}
                  className="w-full aspect-[4/3] bg-surface-800/60 flex items-center justify-center relative overflow-hidden"
                  title="Open project"
                >
                  {project.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-surface-600 group-hover:text-brand-400 transition-colors" />
                  )}
                  <span className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 backdrop-blur px-3 py-2 rounded-lg text-white">
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </span>
                  </span>
                </button>
                <div className="p-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{project.title}</h4>
                    <p className="text-[11px] text-surface-500 mt-0.5">
                      {project.aspectRatio} · {timeAgo(project.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}