/** Catálogo canónico de roles NARA (se siembra en la colección `roles`). */
export const NARA_ROLES = [
  {
    id: "admin",
    slug: "admin",
    name: "Administrador",
    description: "Configura el programa: territorios, equipos, usuarios, rutas, activos e informes.",
    href: "/inicio",
    nk: "admin",
  },
  {
    id: "experto",
    slug: "experto",
    name: "Experto de campo",
    description: "Visitas, captación, listas de trabajo y revisitas.",
    href: "/experto",
    nk: null,
  },
  {
    id: "clinico",
    slug: "clinico",
    name: "Clínico",
    description: "Casos clínicos, alertas y carga de pacientes.",
    href: "/clinico",
    nk: "clin",
  },
  {
    id: "paciente",
    slug: "paciente",
    name: "Paciente",
    description: "App del paciente y plan de cuidado.",
    href: "/paciente",
    nk: null,
  },
  {
    id: "observador",
    slug: "observador",
    name: "Observador",
    description: "Solo lectura agregada; módulos según tipo de organización.",
    href: "/observador",
    nk: null,
  },
] as const;

export function isAdminRole(role?: string | null) {
  return !!role && /Admin/i.test(role);
}
