"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function CTASection() {
  const [email, setEmail] = useState("");
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Start Your First Infographic Free
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) window.location.assign("/generate");
          }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto"
        >
          <input
            id="email-cta"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 h-14 px-5 rounded-xl bg-surface-800/60 border border-white/10 text-white placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Button type="submit" variant="cta" size="lg" className="px-6">
            Get Started
          </Button>
        </form>
        <p className="mt-4 text-xs text-surface-400">
          Join 2,000+ creators. No spam, unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
