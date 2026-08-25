"use client";

import Link from "next/link";
import { Sparkles, Github } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Generator", href: "/generate" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Providers", href: "/#providers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: "https://github.com/piyushmehta910/Infographic-generator" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-navy-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">
                InfoGraphic <span className="text-brand-300">AI</span>
              </span>
            </Link>
            <p className="text-xs text-surface-500 leading-relaxed max-w-xs">
              AI-powered infographics from your text — designed in seconds. Bring your
              own AI key; everything stays local to this browser.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-surface-500 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500">
          <span>© {new Date().getFullYear()} InfoGraphic AI. Built with Next.js + Tailwind + AI.</span>
          <a
            href="https://github.com/piyushmehta910/Infographic-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-surface-300 transition-colors"
          >
            <Github className="w-4 h-4" /> Open source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}