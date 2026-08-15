"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function LandingHeader() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-navy-950/70 backdrop-blur supports-[backdrop-filter]:bg-navy-950/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />
          <span className="font-display font-semibold text-xl text-white">
            InfoGraphic AI
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-surface-300">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            Sign in
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push("/generate")}>
            Start Creating Free
          </Button>
        </div>
      </div>
    </header>
  );
}
