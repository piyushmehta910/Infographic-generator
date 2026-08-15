import { FileText } from "lucide-react";

interface UseCase {
  id: string;
  title: string;
  desc: string;
}

const useCases: UseCase[] = [
  {
    id: "marketing",
    title: "Marketing",
    desc: "Turn campaign data and blog posts into scroll-stopping social infographics.",
  },
  {
    id: "education",
    title: "Education",
    desc: "Synthesize lectures, research, and textbooks into study-ready visuals.",
  },
  {
    id: "social",
    title: "Social Media",
    desc: "Generate platform-optimized carousels and stat cards instantly.",
  },
  {
    id: "reports",
    title: "Reports",
    desc: "Convert quarterly data and meeting notes into executive one-pagers.",
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-16 md:py-24 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Built for every use case
        </h2>
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {useCases.map((u) => (
            <div key={u.id} className="p-6">
              <div className="w-12 h-12 rounded-xl bg-surface-800 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{u.title}</h3>
              <p className="text-sm text-surface-300">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
