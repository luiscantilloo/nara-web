/** Configuración pública del sitio (dominio, SEO). */

export const SITE_NAME = "NARA";
export const SITE_TAGLINE = "Programa de salud mental post-sismo del Eje Cafetero";
export const SITE_DESCRIPTION =
  "NARA acompaña a comunidades del Eje Cafetero con rutas de cuidado en salud mental después de un sismo. Plataforma para equipos clínicos, de campo y personas atendidas.";

/** Dominio de producción. Override con NEXT_PUBLIC_SITE_URL en Vercel/local. */
export const DEFAULT_SITE_URL = "https://proyectonara.com";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return DEFAULT_SITE_URL;
}

/** Rutas públicas indexables (el resto de la app es privada). */
export const PUBLIC_PATHS = [
  "/",
  "/landing",
  "/landing/privacidad",
  "/landing/tratamiento-de-datos",
  "/ingreso",
] as const;

/** Prefijos que no deben indexarse ni listarse en el sitemap. */
export const PRIVATE_PATH_PREFIXES = [
  "/api",
  "/admin",
  "/clinico",
  "/experto",
  "/paciente",
  "/observador",
  "/inicio",
  "/personas",
  "/territorios",
  "/equipos",
  "/usuarios",
  "/rutas",
  "/activos",
  "/informes",
  "/informe",
  "/perfil",
] as const;
