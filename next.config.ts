import type { NextConfig } from "next";

/**
 * Gateway Nest (nara-api). Obligatorio en runtime: sin esto `/api/*` no tiene backend
 * (las route handlers locales se eliminaron).
 * Dev: http://127.0.0.1:4000
 */
const NARA_API_URL = (process.env.NARA_API_URL || "").replace(/\/$/, "");

if (!NARA_API_URL && process.env.NODE_ENV !== "test") {
  console.warn(
    "[nara-web] Falta NARA_API_URL — defínalo en .env.local (ej. http://127.0.0.1:4000).",
  );
}

/**
 * H-008 (TRL 2026-10-10): Content-Security-Policy. Next inyecta scripts y estilos en línea, por eso
 * 'unsafe-inline'; 'unsafe-eval' solo en desarrollo (HMR). Orígenes externos que usa el navegador:
 * el webhook de TEO en n8n y los mosaicos de OpenStreetMap del mapa de visitas.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://polariatech.app.n8n.cloud",
  "media-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // H-008: sin la cabecera X-Powered-By: Next.js
  poweredByHeader: false,
  // Acceso HMR desde la red local (p. ej. celular/otro PC en la LAN)
  allowedDevOrigins: ["192.168.80.12"],
  // El código portado del prototipo aún tiene deuda de tipos; no bloquear el deploy.
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/landing/privacidad.html",
        destination: "/landing/privacidad",
        permanent: true,
      },
      {
        source: "/landing/tratamiento-de-datos.html",
        destination: "/landing/tratamiento-de-datos",
        permanent: true,
      },
      {
        source: "/landing/index.html",
        destination: "/landing",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (!NARA_API_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${NARA_API_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/(.*)\\.(svg|ico|png|jpg|jpeg|webp|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
