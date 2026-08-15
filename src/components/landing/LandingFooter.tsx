import { Logo } from "@/components/ui/Logo";
import { Github } from "lucide-react";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "/api/v1/templates" },
  { label: "Blog", href: "/blog" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-7" />
            <span className="font-display font-semibold text-xl text-white">
              InfoGraphic AI
            </span>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-surface-400">
            {footerLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/infographicai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.243 8.26 8.175 11.24H16.34L11.01 13.726 5.093 18.25H1.231l7.62-8.75L1.5 2.25H8.08l6.66 8.845L18.244 2.25Z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/infographicai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.45 20.45h-3.45v-5.31c0-1.27-.02-2.91-1.76-2.91-1.76 0-2.02 1.37-2.02 2.82v5.39h-3.45V9h3.32v1.56h.05c.46-.86 1.57-1.77 3.23-1.77 3.32 0 3.93 2.18 3.93 5.05v6.61Z" />
              </svg>
            </a>
            <a
              href="https://github.com/infographicai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-xs text-surface-500">
          © {new Date().getFullYear()} InfoGraphic AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
