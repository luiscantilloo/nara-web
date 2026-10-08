/**
 * 7 estados del control clínico de pacientes (fuente de verdad).
 *
 * Flujo (Edgar, 8 oct 2026):
 *  Sin evaluación → (experto termina la entrevista) → Por aprobar
 *    → (clínico aprueba) → Aprobado → Activo | Inactivo | Crisis
 *    → (clínico rechaza) → Rechazado → (experto vuelve a entrevistar) → Por aprobar
 *
 * Toda persona nace en Sin evaluación: sin perfil y sin avance.
 * Activo, Inactivo y Crisis son posteriores a la aprobación.
 * La pregunta 9 en la visita abre alerta de crisis antes de aprobar;
 * ese caso no tiene estado propio en el catálogo de Edgar.
 */
export const PATIENT_STATES = [
  {
    id: "sin_evaluacion",
    label: "Sin evaluación",
    bg: "#FFF4CC",
    fg: "#161413",
  },
  {
    id: "por_aprobar",
    label: "Por aprobar",
    bg: "#F7E2D2",
    fg: "#7A3A10",
  },
  {
    id: "aprobado",
    label: "Aprobado",
    bg: "#E3F1E8",
    fg: "#161413",
  },
  {
    id: "rechazado",
    label: "Rechazado",
    bg: "#EFDCDA",
    fg: "#9C2F25",
  },
  {
    id: "activo",
    label: "Activo",
    bg: "#E3F1E8",
    fg: "#161413",
  },
  {
    id: "inactivo",
    label: "Inactivo",
    bg: "#F0ECE6",
    fg: "#5E5750",
  },
  {
    id: "crisis",
    label: "Crisis",
    bg: "#FDE7E4",
    fg: "#8A1C14",
  },
] as const;

export type PatientStateId = (typeof PATIENT_STATES)[number]["id"];

const BY_ID = Object.fromEntries(PATIENT_STATES.map((s) => [s.id, s])) as Record<
  PatientStateId,
  (typeof PATIENT_STATES)[number]
>;

/** Alias de etiquetas legacy / tipográficas → id canónico. */
const LABEL_ALIASES: Record<string, PatientStateId> = {
  "sin evaluacion": "sin_evaluacion",
  "sin evaluación": "sin_evaluacion",
  "por aprobar": "por_aprobar",
  pendiente: "por_aprobar",
  aprobado: "aprobado",
  aprobada: "aprobado",
  activa: "activo",
  activo: "activo",
  rechazado: "rechazado",
  rechazada: "rechazado",
  inactiva: "inactivo",
  inactivo: "inactivo",
  crisis: "crisis",
  "en crisis": "crisis",
  // Legados del catálogo anterior
  completada: "aprobado",
  "ruta completada": "aprobado",
  retirada: "inactivo",
  baja: "inactivo",
};

/** Etiqueta canónica para persistir en people.status / patients.status. */
export function patientStateLabel(id: PatientStateId): string {
  return (BY_ID[id] || BY_ID.activo).label;
}

/** Normaliza texto de estado al id canónico. */
export function normalizePatientState(
  raw: unknown,
  opts?: { hasProfile?: boolean; inCrisis?: boolean; inactiveDays?: number | null },
): PatientStateId {
  if (opts?.inCrisis) return "crisis";
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const aliased = s ? LABEL_ALIASES[s] : undefined;
  // «Activa» quedó como valor por defecto de la carga. Sin perfil no hubo
  // evaluación ni aprobación, así que el estado de nacimiento es Sin evaluación.
  if (aliased === "activo" && opts?.hasProfile === false) return "sin_evaluacion";
  if (aliased) return aliased;
  if (opts?.inactiveDays != null && opts.inactiveDays >= INACTIVITY_DAYS) {
    return "inactivo";
  }
  if (!opts?.hasProfile) return "sin_evaluacion";
  return "activo";
}

export function patientStateMeta(id: PatientStateId) {
  return BY_ID[id] || BY_ID.activo;
}

/** 15 perfiles P01–P15 (5 riesgo × 3 digital). */
export function profileCatalog(RISK: { k: string }[], DIG: { k: string }[]) {
  const rows: {
    code: string;
    risk: number;
    dig: number;
    riskLabel: string;
    digLabel: string;
    label: string;
  }[] = [];
  for (let r = 0; r < 5; r++) {
    for (let d = 0; d < 3; d++) {
      const code = "P" + String(r * 3 + d + 1).padStart(2, "0");
      rows.push({
        code,
        risk: r,
        dig: d,
        riskLabel: RISK[r]?.k || "",
        digLabel: DIG[d]?.k || "",
        label:
          code +
          " · " +
          (RISK[r]?.k || "") +
          " × digital " +
          (DIG[d]?.k || "").toLowerCase(),
      });
    }
  }
  return rows;
}

/** Días sin check-in / login para marcar inactividad clínica. */
export const INACTIVITY_DAYS = 3;
