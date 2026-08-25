"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Do I need an API key to use it?",
    a: "Yes. Generation runs through an AI provider you connect — OpenRouter, NVIDIA NIM, Groq, or Mistral. Add your key once in Settings and it's stored only in your browser.",
  },
  {
    q: "Where are my API keys stored?",
    a: "Only in your browser's local storage. Keys are never stored on our servers — each generation request relays your key straight to the AI provider you chose.",
  },
  {
    q: "What types of input can I use?",
    a: "Paste any text — an article, blog post, notes, or a rough idea. The AI analyzes it, structures the key points, and designs the infographic.",
  },
  {
    q: "What export formats are supported?",
    a: "PNG, JPG, SVG, PDF, and JSON. High-resolution exports are generated at 2x pixel ratio for crisp social and print use.",
  },
  {
    q: "Is my content used for training?",
    a: "No. Your content is sent only to the AI provider you explicitly connect, for the purpose of generating your infographic. We don't collect or train on it.",
  },
  {
    q: "Is it free?",
    a: "The tool itself is free — you only pay for the AI provider usage you configure with your own key.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-surface-300 mb-4">
            <Plus className="w-3.5 h-3.5 text-brand-300" /> FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight text-balance">
            Questions, <span className="text-gradient">answered</span>
          </h2>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={f.q} delay={i * 0.05}>
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`faq-answer-${i}`}
                  className={`w-full text-left rounded-2xl border p-5 transition-all card-glow ${
                    open ? "border-brand-400/30 bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white text-sm sm:text-base">{f.q}</span>
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full bg-brand-gradient/20 border border-brand-400/25 flex items-center justify-center text-brand-300 transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </span>
                  <span
                    id={`faq-answer-${i}`}
                    role="region"
                    className={`grid transition-all duration-300 ${
                      open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <span className="overflow-hidden text-sm text-surface-400 leading-relaxed">
                      {f.a}
                    </span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}