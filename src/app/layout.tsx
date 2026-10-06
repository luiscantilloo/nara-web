import type { Metadata, Viewport } from "next";
import { NaraProvider } from "@/providers/nara-provider";
import {
  DEFAULT_SITE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/site";
import "@/styles/globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || DEFAULT_SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Proyecto NARA" }],
  creator: "Proyecto NARA",
  publisher: "Proyecto NARA",
  keywords: [
    "NARA",
    "salud mental",
    "Eje Cafetero",
    "post-sismo",
    "Quindío",
    "Colombia",
    "cuidado comunitario",
  ],
  category: "health",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
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
  icons: {
    icon: [
      { url: "/nara/marca/favicon.svg", type: "image/svg+xml" },
      { url: "/nara/marca/favicon.ico" },
    ],
    apple: [{ url: "/nara/marca/favicon.svg" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0ECE6" },
    { media: "(prefers-color-scheme: dark)", color: "#FDCD22" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "Proyecto NARA",
    url: siteUrl,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Eje Cafetero, Colombia",
    },
    inLanguage: "es-CO",
  };

  return (
    <html lang="es-CO">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NaraProvider>{children}</NaraProvider>
      </body>
    </html>
  );
}
