/** Tabs de la app paciente como rutas. */
export const PACIENTE_TAB_ROUTES = {
  /** Inicio (hub con las 6 herramientas). */
  home: "/paciente",
  /** Estado de ánimo (herramienta mood). */
  mood: "/paciente/animo",
  chat: "/paciente/chat",
  route: "/paciente/ruta",
  hist: "/paciente/historial",
  resumen: "/paciente/resumen",
  cuentos: "/paciente/cuentos",
  videos: "/paciente/videos",
  /** Herramientas de la ruta (mismo id que SERVICES / clínico). */
  clin: "/paciente/clinico",
  tech: "/paciente/tecnicas",
  revisit: "/paciente/revisita",
} as const;

export type PacienteTab = keyof typeof PACIENTE_TAB_ROUTES;

export const PACIENTE_PATH_TO_TAB: Record<string, PacienteTab> = {
  "/paciente": "home",
  "/paciente/animo": "mood",
  "/paciente/chat": "chat",
  "/paciente/ruta": "route",
  "/paciente/historial": "hist",
  "/paciente/resumen": "resumen",
  "/paciente/cuentos": "cuentos",
  "/paciente/videos": "videos",
  "/paciente/clinico": "clin",
  "/paciente/tecnicas": "tech",
  "/paciente/revisita": "revisit",
};

export function pacientePathForTab(tab: string): string {
  return (
    PACIENTE_TAB_ROUTES[tab as PacienteTab] || PACIENTE_TAB_ROUTES.home
  );
}

export function pacienteTabForPath(pathname: string): PacienteTab {
  const base = pathname.replace(/\/$/, "") || "/paciente";
  return PACIENTE_PATH_TO_TAB[base] || "home";
}
