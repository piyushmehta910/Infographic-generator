import {
  Brain,
  Layout,
  Palette,
  BarChart3,
  ImageIcon,
  Users,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: <Brain className="w-6 h-6 text-brand-400" />,
    title: "AI Content Extraction",
    desc: "Pulls key facts, stats, and structure from text, URLs, and images.",
  },
  {
    icon: <Layout className="w-6 h-6 text-brand-400" />,
    title: "12+ Smart Layouts",
    desc: "Auto-selected by AI based on content type — marketing, reports, timelines.",
  },
  {
    icon: <Palette className="w-6 h-6 text-brand-400" />,
    title: "Brand Kit",
    desc: "Save colors, fonts, and logos once. Apply to every generation instantly.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-brand-400" />,
    title: "Data Visualization",
    desc: "CSV columns auto-map to bar, line, and pie charts with zero config.",
  },
  {
    icon: <ImageIcon className="w-6 h-6 text-brand-400" />,
    title: "Multi-Export",
    desc: "PNG 2x, print-ready PDF, editable SVG — all from one click.",
  },
  {
    icon: <Users className="w-6 h-6 text-brand-400" />,
    title: "Team Collaboration",
    desc: "Share links, leave comments, and co-edit infographics together.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Everything you need to design
        </h2>
        <p className="text-surface-300">
          Built for creators, marketers, educators, and teams.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="glass-card rounded-2xl p-6 flex flex-col border border-white/5 hover:border-white/10 transition-colors"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-surface-300 flex-grow">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
