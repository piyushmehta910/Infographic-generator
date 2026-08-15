import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://infographic-ai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "InfoGraphic AI - Generate Data-Driven Infographics in 30 Seconds",
    template: "%s | InfoGraphic AI",
  },
  description:
    "Turn blog posts, CSV data, or rough ideas into publication-ready infographics. No design skills needed. Free to start.",
  keywords:
    "infographic, AI, generator, design, template, visual, content, SaaS, marketing, presentation",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InfoGraphic AI",
  },
  openGraph: {
    title:
      "InfoGraphic AI - Generate Data-Driven Infographics in 30 Seconds",
    description:
      "Turn blog posts, CSV data, or rough ideas into publication-ready infographics. No design skills needed. Free to start.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "InfoGraphic AI",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "InfoGraphic AI - Generate Data-Driven Infographics in 30 Seconds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "InfoGraphic AI - Generate Data-Driven Infographics in 30 Seconds",
    description:
      "Turn blog posts, CSV data, or rough ideas into publication-ready infographics. No design skills needed. Free to start.",
    images: ["/opengraph-image"],
  },
    robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#8B5CF6",
};

const softwareApplicationJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "InfoGraphic AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "200" },
});

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: softwareApplicationJsonLd }}
        />
      </head>
      <body className="min-h-screen bg-navy-950 text-surface-100 antialiased font-body">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
