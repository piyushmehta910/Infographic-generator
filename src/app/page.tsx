"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Zap,
  Sparkles,
  Download,
  Layout,
  Palette,
  Image,
  ArrowRight,
  Star,
  Check,
  Menu,
  X,
  Github,
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Content",
    description:
      "Transform text, ideas, or images into structured infographic content with AI correction and formatting.",
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: "Template-Driven Design",
    description:
      "Choose from 8+ professional templates. AI generates structured JSON, not HTML — our templates handle the design.",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Smart Themes",
    description:
      "Auto-selected or manual themes including Light, Dark, Minimal, Glassmorphism, Corporate, and more.",
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: "Image Analysis",
    description:
      "Upload images or paste URLs. AI analyzes content, colors, and layout to generate matching infographics.",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Export Anywhere",
    description:
      "Download as PNG, SVG, PDF, HTML, or JSON. High-resolution exports ready for print or social media.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Multi-Provider AI",
    description:
      "Bring your own API key for OpenAI, Gemini, Claude, OpenRouter, or Groq. Your data, your choice.",
  },
];

const templates = [
  {
    name: "Modern",
    desc: "Clean & minimal",
    color: "from-violet-500 to-purple-600",
  },
  {
    name: "Business",
    desc: "Corporate & professional",
    color: "from-blue-600 to-blue-800",
  },
  {
    name: "Timeline",
    desc: "Chronological flow",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Comparison",
    desc: "Side-by-side",
    color: "from-orange-500 to-red-600",
  },
  {
    name: "Technology",
    desc: "Tech-forward",
    color: "from-cyan-500 to-blue-600",
  },
  {
    name: "Startup",
    desc: "Energetic & modern",
    color: "from-pink-500 to-rose-600",
  },
  {
    name: "Education",
    desc: "Learning-focused",
    color: "from-green-500 to-emerald-600",
  },
  {
    name: "Marketing",
    desc: "Social-optimized",
    color: "from-indigo-500 to-purple-600",
  },
];

const faqs = [
  {
    q: "How does the AI generate infographics?",
    a: "AI analyzes your content and returns structured JSON. Our template engine then renders that JSON into a beautiful HTML/CSS infographic. AI never generates HTML directly.",
  },
  {
    q: "Do I need an API key?",
    a: "Yes, you bring your own API key from your preferred AI provider (OpenAI, Gemini, Claude, etc.). Keys are stored locally in your browser for security.",
  },
  {
    q: "What formats can I export?",
    a: "Export as PNG, SVG, PDF, HTML, or JSON Project. All exports preserve high resolution.",
  },
  {
    q: "Can I edit the infographic after generation?",
    a: "Yes! After AI generates the content, you can edit text, fonts, colors, layout, and more in our built-in editor.",
  },
  {
    q: "Is my data secure?",
    a: "Your API keys stay in your browser. Content is sent directly to your chosen AI provider. We never store your content on our servers.",
  },
  {
    q: "Can I use my own template?",
    a: "Yes! The template system is extensible. You can add custom HTML/CSS templates to the template library.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InfoGraphic AI
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#templates"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Templates
              </a>
              <a
                href="#faq"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                FAQ
              </a>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100"
            >
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-gray-600 py-2">
                  Features
                </a>
                <a href="#templates" className="block text-gray-600 py-2">
                  Templates
                </a>
                <a href="#faq" className="block text-gray-600 py-2">
                  FAQ
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-600 font-medium mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Infographic Generator
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Turn Ideas Into
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Stunning Infographics
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Transform text, ideas, and images into beautiful, professional
              infographics. AI structures your content — you have full control
              over the design.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                Create Your First Infographic
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full text-lg font-semibold hover:border-gray-300 transition-all"
              >
                View Templates
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: "8+", label: "Templates" },
                { value: "5", label: "AI Providers" },
                { value: "5", label: "Export Formats" },
                { value: "12", label: "Themes" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Design Control
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A flexible platform where you control every aspect of your
              infographic design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section id="templates" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Flexible Design Options
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from professional templates or create your own custom
              design. All options are fully responsive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.name}
                whileHover={{ y: -4 }}
                className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer"
              >
                <div
                  className={`h-40 bg-gradient-to-br ${template.color} flex items-center justify-center`}
                >
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold">{template.name}</div>
                    <div className="text-sm opacity-80">{template.desc}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {["1:1", "16:9", "4:5"].map((ratio) => (
                      <span
                        key={ratio}
                        className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        {ratio}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Design Flexibility FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center gap-4"
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? null : index)
                  }
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: activeFaq === index ? 180 : 0 }}
                    className="text-gray-400 flex-shrink-0"
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-3xl p-12 md:p-20 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Design?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Start creating custom infographics with full design control. No
              design skills required.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            © 2026 InfoGraphic AI. Built with Next.js, TypeScript, and Tailwind
            CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
