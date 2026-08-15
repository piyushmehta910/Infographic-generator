"use client";

import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LiveDemo from "@/components/landing/LiveDemo";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import Pricing from "@/components/landing/Pricing";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-surface-100 font-body">
      <LandingHeader />
      <Hero />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <UseCases />
      <Pricing />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
