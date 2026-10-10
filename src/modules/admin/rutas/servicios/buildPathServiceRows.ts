import { NARA_SERVICES } from "@/lib/nara-services";
import type { PathServiceRowModel } from "./types";

type Draft = { s: Record<string, string> };
type Colors = { verde: string; lineas: string; tinta: string; texto2: string };

/** Mismas 3 que en paciente: aún no se activan en la ruta. */
export const PATH_SERVICES_LOCKED = new Set(["tech", "revisit", "cursos"]);

/**
 * Arma las filas del editor de Rutas desde el catálogo por servicio
 * (`src/lib/nara-services/<id>.js`) + estado del borrador.
 */
export function buildPathServiceRows(
  dr: Draft,
  C: Colors,
  api: {
    setDraft: (code: string, fn: (d: Draft & { months?: number }) => void) => void;
    setState: (patch: Record<string, unknown>) => void;
  },
  pathCode: string,
): PathServiceRowModel[] {
  return NARA_SERVICES.map((sv) => {
    const locked = PATH_SERVICES_LOCKED.has(sv.id);
    const on = locked
      ? false
      : !!(dr.s[sv.id] && String(dr.s[sv.id]).trim());
    const isCursos = sv.id === "cursos" || !!sv.hasLibraryBtn;
    return {
      id: sv.id,
      name: sv.name,
      note: locked
        ? (sv.note || "") + (sv.note ? " · " : "") + "Próximamente · no se puede activar"
        : sv.note || "",
      op: locked ? 0.45 : on ? 1 : 0.6,
      swBg: on ? C.verde : "#C4BDB3",
      x: on ? "25px" : "3px",
      cur: locked ? "not-allowed" : "pointer",
      locked,
      lockHint: locked ? "Próximamente" : undefined,
      toggle: () => {
        if (locked) return;
        api.setDraft(pathCode, (d) => {
          // Apagado explícito (''): pathList no lo rellena desde el default.
          if (d.s[sv.id] && String(d.s[sv.id]).trim()) d.s[sv.id] = "";
          else d.s[sv.id] = isCursos ? "Biblioteca" : sv.freqs[0] || "Activo";
        });
      },
      freqs: locked || isCursos
        ? []
        : (sv.freqs || []).map((label) => {
            const sel = dr.s[sv.id] === label;
            return {
              label,
              bd: sel ? C.verde : C.lineas,
              bg: sel ? "#FFF4CC" : "#fff",
              fg: on ? C.tinta : C.texto2,
              pick: () => {
                if (locked) return;
                api.setDraft(pathCode, (d) => {
                  d.s[sv.id] = label;
                });
              },
            };
          }),
      libBtn:
        !locked && isCursos
          ? { label: "Biblioteca", go: () => api.setState({ pathTab: "3" }) }
          : null,
    };
  });
}
