/** Logos de las 6 casillas de Herramientas (ficha clínico). */
export const HERRAMIENTA_LOGOS: Record<string, string> = {
  mood: "/nara/herramientas/mood.png",
  clin: "/nara/herramientas/clin.png",
  ia: "/nara/herramientas/ia.png",
  tech: "/nara/herramientas/tech.png",
  revisit: "/nara/herramientas/revisit.png",
  cursos: "/nara/herramientas/cursos.png",
};

export function logoForHerramienta(id: string): string | undefined {
  return HERRAMIENTA_LOGOS[id];
}
