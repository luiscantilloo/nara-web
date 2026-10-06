import type { Metadata, Viewport } from "next";
import { NaraProvider } from "@/providers/nara-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "NARA",
    template: "%s · NARA",
  },
  description: "Programa de salud mental post-sismo del Eje Cafetero",
  icons: {
    icon: [
      { url: "/nara/marca/favicon.svg", type: "image/svg+xml" },
      { url: "/nara/marca/favicon.ico" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <NaraProvider>{children}</NaraProvider>
      </body>
    </html>
  );
}
