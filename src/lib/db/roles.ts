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

export type NaraRoleId = (typeof NARA_ROLES)[number]["id"];

/** Etiquetas UI (incl. formas de género) → roleId. */
export const ROLE_LABEL_TO_ID: Record<string, NaraRoleId> = {
  Administrador: "admin",
  Administradora: "admin",
  "Experto de campo": "experto",
  "Experta de campo": "experto",
  Clínico: "clinico",
  Clínica: "clinico",
  Observador: "observador",
  Paciente: "paciente",
};

export const STAFF_ROLE_IDS: NaraRoleId[] = ["admin", "experto", "clinico"];
export const PROGRAM_ROLE_IDS: NaraRoleId[] = ["admin", "experto", "clinico", "observador"];
export const MUTATING_ROLE_IDS: NaraRoleId[] = ["admin", "experto", "clinico"];

export function isAdminRole(role?: string | null) {
  return !!role && /Admin/i.test(role);
}

export function isAdminRoleId(roleId?: string | null) {
  return roleId === "admin";
}

export function hrefForRoleId(roleId?: string | null) {
  return NARA_ROLES.find((r) => r.id === roleId)?.href || "/ingreso";
}

/** Bandeja de notificaciones: nk fijo del rol, o id de cuenta si el rol no tiene bandeja compartida. */
export function resolveNotifKey(roleId: string | null | undefined, accountId: string) {
  const role = NARA_ROLES.find((r) => r.id === roleId);
  if (!role) return accountId;
  if (role.nk) return role.nk;
  return accountId;
}

export function roleIdFromLabel(role?: string | null): NaraRoleId | null {
  if (!role) return null;
  return ROLE_LABEL_TO_ID[role] || null;
}
