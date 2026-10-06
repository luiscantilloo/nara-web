/** Rutas absolutas bajo /public/nara para assets del prototipo. */
export function naraAsset(path: string): string {
  if (!path) return path;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  if (path.startsWith("marca/") || path.startsWith("recursos/")) return `/nara/${path}`;
  return `/nara/marca/${path}`;
}
