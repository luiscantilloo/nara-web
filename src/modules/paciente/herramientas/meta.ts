import { NARA_SERVICES } from "@/lib/nara-services";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

/** Orden y etiquetas = catálogo compartido (`src/lib/nara-services/<id>.js`). */
export const PACIENTE_HERRAMIENTAS: PacienteHerramientaMeta[] = NARA_SERVICES.map(
  (s) => ({
    id: s.id as PacienteHerramientaId,
    name: s.name,
    navLabel: s.navLabel,
  }),
);

export const PACIENTE_HERRAMIENTA_IDS: PacienteHerramientaId[] =
  PACIENTE_HERRAMIENTAS.map((h) => h.id);

/** Filtra las activas en la ruta del paciente (mods.on). */
export function activePacienteHerramientas(mods: Record<string, boolean | undefined>) {
  return PACIENTE_HERRAMIENTAS.filter((h) => !!mods[h.id]);
}
