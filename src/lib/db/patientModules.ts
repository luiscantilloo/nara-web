/** Módulos de la app del paciente alineados con servicios de perfil. */
export const PATIENT_APP_MODULES = [
  { id: "mood", name: "Estado de ánimo", desc: "Check-in «¿Cómo se siente hoy?»" },
  { id: "clin", name: "Psicólogo clínico", desc: "Servicio principal · citas clínicas" },
  { id: "ia", name: "Acompañante con IA (TEO)", desc: "Botón TEO en la app" },
  { id: "tech", name: "Técnicas guiadas", desc: "Respiración, sueño, anclaje" },
  { id: "revisit", name: "Revisita del experto", desc: "Ventana de revisita en la app" },
  { id: "cursos", name: "Cursos y cuentos", desc: "Mi curso + biblioteca" },
] as const;

export type PatientModuleId = (typeof PATIENT_APP_MODULES)[number]["id"];

/** Por ahora: los 6 servicios de ruta, activos por defecto. */
export const DEFAULT_PATIENT_MODULES: PatientModuleId[] = [
  "mood",
  "clin",
  "ia",
  "tech",
  "revisit",
  "cursos",
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
