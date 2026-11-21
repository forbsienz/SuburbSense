import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { FloatingBrandLoader } from "@/components/brand/FloatingBrandLoader";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHELL_CLASS,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "New Zealand crime statistics",
    "suburb safety",
    "NZ Police victimisation",
    "crime rates by suburb",
    "community safety NZ",
    "Area Unit crime",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NZ",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/suburb-sense-logo.png",
        width: 1342,
        height: 316,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/brand/suburb-sense-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "community safety",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: absoluteUrl("/"),
  inLanguage: "en-NZ",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description:
    "Independent community safety insights from open NZ Police victimisation data. Not affiliated with NZ Police or Stats NZ.",
  logo: absoluteUrl("/brand/suburb-sense-logo.png"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={`${nunitoSans.variable} ${sourceSerif.variable}`}>
      <body>
        <JsonLd data={[websiteJsonLd, orgJsonLd]} />
        <SiteHeader />
        <main className={`${SITE_SHELL_CLASS} min-h-screen py-6 sm:py-8`}>{children}</main>
        <SiteFooter />
        <Suspense fallback={null}>
          <FloatingBrandLoader />
        </Suspense>
        <SiteAnalytics />
      </body>
    </html>
  );
}
