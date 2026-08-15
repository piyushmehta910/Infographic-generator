import { Upload, Layout, Brain, Download } from "lucide-react";

interface Step {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    step: "01",
    title: "Paste content or upload data",
    desc: "Drop a blog post, CSV, image URL, or rough idea.",
    icon: <Upload className="w-6 h-6 text-brand-400" />,
  },
  {
    step: "02",
    title: "Pick a layout style",
    desc: "Minimal, Bold, Corporate, or Creative — or let AI choose.",
    icon: <Layout className="w-6 h-6 text-brand-400" />,
  },
  {
    step: "03",
    title: "AI structures and designs",
    desc: "Our pipeline analyzes, blueprints, and renders in seconds.",
    icon: <Brain className="w-6 h-6 text-brand-400" />,
  },
  {
    step: "04",
    title: "Download or edit",
    desc: "Export as PNG/PDF/SVG, or keep iterating in the editor.",
    icon: <Download className="w-6 h-6 text-brand-400" />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          How it works
        </h2>
        <p className="text-surface-300">
          Four simple steps from idea to finished infographic.
        </p>
      </div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((s) => (
          <div key={s.step} className="text-center">
            <div className="flex justify-center mb-4">{s.icon}</div>
            <div className="text-sm font-semibold text-brand-400 mb-2">
              Step {s.step}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
            <p className="text-sm text-surface-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
