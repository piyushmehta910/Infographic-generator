"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

interface Tier {
  name: string;
  sub: string;
  price: string;
  features: string[];
  cta: string;
  variant: "primary" | "secondary" | "cta";
  popular: boolean;
}

const pricingTiers: Tier[] = [
  {
    name: "Free",
    sub: "5 generations/mo",
    price: "$0",
    features: ["5 generations per month", "PNG export", "Watermarked", "Community support"],
    cta: "Get Started",
    variant: "secondary",
    popular: false,
  },
  {
    name: "Pro",
    sub: "50 generations/mo",
    price: "$12",
    features: ["50 generations per month", "PNG + PDF + SVG", "No watermark", "Brand kit", "Priority support"],
    cta: "Get Pro",
    variant: "cta",
    popular: true,
  },
  {
    name: "Team",
    sub: "Unlimited",
    price: "$39",
    features: ["Unlimited generations", "Team workspace", "API access", "Priority support"],
    cta: "Get Team",
    variant: "primary",
    popular: false,
  },
];

const faqs = [
  { q: "Can I try it for free?", a: "Yes — sign up for 5 free generations per month, no credit card required. Upgrade anytime for more credits and watermark-free exports." },
  { q: "Is my data private?", a: "We never store or train on your content. Your API key stays in your browser. See our Privacy Policy for details." },
  { q: "Which AI models are supported?", a: "OpenAI, Google Gemini, Anthropic Claude, OpenRouter, and Groq. Bring your own key — we never see it." },
  { q: "What export formats do you offer?", a: "PNG (up to 4K), JPG, print-ready PDF, and editable SVG. Pro and Team plans add SVG and higher resolution." },
  { q: "Can I cancel anytime?", a: "Absolutely. There are no contracts. Cancel or pause your subscription in one click from your account settings." },
  { q: "Do exports count as commercial use?", a: "Yes. Any infographic you create may be used for commercial purposes, including client work and resale." },
];

export default function Pricing() {
    const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-surface-300">
          Start free. Upgrade as you grow, or cancel anytime.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        {pricingTiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
            className="relative"
          >
            <GlassCard
              className={`h-full flex flex-col p-8 ${
                tier.popular
                  ? "ring-2 ring-brand-500/50 border-brand-500/40"
                  : "border-white/10"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-brand-gradient text-white rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-surface-400 text-sm mt-1">{tier.sub}</p>
              </div>
              <div className="mt-auto">
                <div className="text-4xl font-bold text-white mb-6">
                  {tier.price}
                  <span className="text-lg text-surface-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-surface-200"
                    >
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={tier.variant} size="lg" className="w-full">
                  {tier.cta}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div id="faq" className="max-w-3xl mx-auto mt-16">
        {faqs.map((faq, i) => (
          <div key={faq.q} className="border-b border-white/5">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-surface-100 font-medium">{faq.q}</span>
              <motion.span
                animate={{ rotate: open === i ? 180 : 0 }}
                className="text-surface-400 flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 text-surface-300">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
