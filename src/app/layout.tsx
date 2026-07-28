import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfoGraphic AI - AI-Powered Infographic Generator",
  description:
    "Create stunning infographics with AI. Transform text, ideas, and images into beautiful, professional infographics.",
  keywords: "infographic, AI, generator, design, template, visual, content",
  openGraph: {
    title: "InfoGraphic AI - AI-Powered Infographic Generator",
    description:
      "Create stunning infographics with AI. Transform text, ideas, and images into beautiful, professional infographics.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "InfoGraphic AI - AI-Powered Infographic Generator",
    description:
      "Create stunning infographics with AI. Transform text, ideas, and images into beautiful, professional infographics.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 antialiased">
        {children}
      </body>
    </html>
  );
}
