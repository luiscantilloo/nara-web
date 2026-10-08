export const TERR: {
  name: string;
  dep: string;
  level: string;
  experts: number;
  cap: number;
  goal: number;
  rural: number;
  ruralG: number;
  br: number;
  insts: number;
  isNew?: boolean;
  sixtyG?: number;
}[] = [];

export const EXPERTS: (string | number)[][] = [];

export const CHECKS: [string, string][] = [
  ["GPS al inicio y al final", "Visita no presencial o fuera del territorio"],
  ["Duración de la entrevista (mín. ~20 min)", "Visitas apuradas o inventadas"],
  ["Consentimiento firmado", "Personas inventadas"],
  ["Detección de duplicados", "Persona registrada dos veces o teléfono compartido"],
  ["Patrones de respuesta", "Respuestas idénticas entre visitas"],
  ["Borradores de TEO confirmados muy rápido", "El experto no revisa lo que propone TEO"],
  ["Llamadas aleatorias del supervisor (~5 %)", "Visitas que no ocurrieron"],
  ["SMS o WhatsApp a la persona", "«¿Le visitó [experto] hoy?»"],
];

export const NOTES: Record<string, string> = {
  wa: "Audio primero · ventana de check-in en la app",
  bracelet: "Sueño y ritmo cardiaco",
  videos: "Biblioteca de videos en la app",
  tech: "Respiración, sueño, anclaje",
  revisit: "Ventana de revisita en la app del paciente",
  cursos: "Curso y cuentos en la app (Mi curso + biblioteca)",
};

export type AdminUiState = {
  view: string;
  agentOpen: boolean;
  terrFilter: string;
  /** Búsqueda en listado de territorios */
  terrQ: string;
  msg: string;
  msgActions: { label: string; go: () => void }[];
  terrForm: boolean;
  tf: {
    dep: string;
    mun: string;
    goal: string;
    level: string;
    rural: string;
    sixty: string;
    mods: { base: boolean; ctx: boolean; videos: boolean };
    insts: { hl: boolean; cu: boolean; cf: boolean };
  };
  tfErr: string;
  expForm: boolean;
  ef: { name: string; phone: string; terr: string; target: string };
  sel: string;
  drafts: Record<string, { s: Record<string, string>; months: number }>;
  scope: string;
  zoom?: number;
  teamTab?: string;
  pathTab?: string;
  pfPer?: string;
  pfTerr?: string;
  pfSort?: string;
  pfDir?: number;
  rd?: unknown;
  rulesMsg?: string;
  au?: { expert: string; clin: string; review: string };
  autoMsg?: string;
  simPhq?: string;
  simDig?: string;
  simDano?: string;
  simLoss?: boolean;
  simQ9?: boolean;
  libKind?: string;
  libSel?: string | null;
  libCourse?: string;
  q?: string;
  pf?: Record<string, string>;
  pendingAsk?: string;
  /** Detalle de activos: territorio + manilla | tablet */
  assetTerr?: string;
  assetKind?: "manilla" | "tablet";
  [key: string]: unknown;
};

export const INITIAL_ADMIN_STATE: AdminUiState = {
  view: "home",
  agentOpen: false,
  terrFilter: "",
  terrQ: "",
  msg: "",
  msgActions: [],
  terrForm: false,
  tf: {
    dep: "Quindío",
    mun: "Filandia",
    goal: "800",
    level: "Veredas seleccionadas",
    rural: "60",
    sixty: "25",
    mods: { base: true, ctx: true, videos: true },
    insts: { hl: true, cu: true, cf: false },
  },
  tfErr: "",
  expForm: false,
  ef: { name: "Natalia Loaiza", phone: "310 555 0142", terr: "Filandia", target: "9" },
  sel: "P08",
  drafts: {},
  scope: "all",
};
