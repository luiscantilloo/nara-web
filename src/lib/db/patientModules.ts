/** Módulos de la app del paciente (admin habilita; el paciente elige cuáles ver). */
export const PATIENT_APP_MODULES = [
  { id: "mood", name: "Estado de ánimo", desc: "Check-in «¿Cómo se siente hoy?»" },
  { id: "ia", name: "TEO (chat)", desc: "Acompañante con IA en la app" },
  { id: "cursos", name: "Cursos y cuentos", desc: "Biblioteca y curso guiado" },
  { id: "videos", name: "Videos", desc: "Videos psicoeducativos" },
  { id: "tech", name: "Técnicas guiadas", desc: "Respiración y técnicas en audio" },
  { id: "wa", name: "WhatsApp", desc: "Check-ins por WhatsApp" },
  { id: "call", name: "Llamadas", desc: "Llamadas de seguimiento" },
  { id: "revisit", name: "Revisita", desc: "Visita del experto de campo" },
  { id: "group", name: "Grupo de apoyo", desc: "Encuentros en la vereda" },
  { id: "social", name: "Ayudas sociales", desc: "Vinculación a ayudas" },
  { id: "clin", name: "Psicólogo clínico", desc: "Citas con clínica" },
  { id: "bracelet", name: "Manilla", desc: "Monitoreo con manilla" },
  { id: "hist", name: "Historial", desc: "Pestaña de historial en la app" },
] as const;

export type PatientModuleId = (typeof PATIENT_APP_MODULES)[number]["id"];

export const DEFAULT_PATIENT_MODULES: PatientModuleId[] = [
  "mood",
  "ia",
  "cursos",
  "videos",
  "tech",
  "hist",
];

const ALLOWED = new Set<string>(PATIENT_APP_MODULES.map((m) => m.id));

/** Filtra ids válidos. Si `raw` no es array, usa `fallback` (por defecto los del programa). */
export function normalizeModuleIds(
  raw: unknown,
  fallback: readonly PatientModuleId[] = DEFAULT_PATIENT_MODULES,
): PatientModuleId[] {
  if (!Array.isArray(raw)) return fallback.slice();
  const out = raw
    .map(String)
    .filter((id): id is PatientModuleId => ALLOWED.has(id));
  return Array.from(new Set(out));
}
