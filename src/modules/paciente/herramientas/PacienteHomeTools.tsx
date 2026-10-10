import { logoForHerramienta } from "@/modules/clinico/herramientas/toolLogos";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

type ToolItem = PacienteHerramientaMeta & {
  on: boolean;
  go: () => void;
  disabled?: boolean;
};

/**
 * Grilla de las 6 herramientas en el home del paciente.
 * Mismos logos y mismas rutas que la barra inferior.
 */
export function PacienteHomeTools({ items }: { items: ToolItem[] }) {
  if (!items.length) return null;

  return (
    <section
      className="rounded-[20px] border border-linea bg-nara-blanco px-4 py-4"
      aria-label="Herramientas"
    >
      <p className="m-0 mb-3 font-texto text-[15px] font-medium text-nara-tinta">
        Herramientas
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((t) => {
          const src = logoForHerramienta(t.id as PacienteHerramientaId);
          const className = [
            "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-linea px-2 py-3 text-center font-texto",
            t.disabled
              ? "cursor-not-allowed opacity-45 grayscale"
              : "cursor-pointer bg-nara-crema/40 active:scale-[0.98]",
            t.on && !t.disabled ? "border-nara-tinta/35 bg-nara-crema" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const body = (
            <>
              {src ? (
                <img
                  src={src}
                  alt=""
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
              ) : null}
              <span className="line-clamp-2 text-[12px] font-medium leading-tight text-nara-tinta">
                {t.navLabel}
              </span>
              {t.disabled ? (
                <span className="text-[10px] text-texto-secundario">
                  Próximamente
                </span>
              ) : null}
            </>
          );

          if (t.disabled) {
            return (
              <div
                key={t.id}
                className={className}
                aria-disabled
                title="Próximamente"
              >
                {body}
              </div>
            );
          }

          return (
            <button
              key={t.id}
              type="button"
              onClick={t.go}
              title={t.name}
              className={className}
            >
              {body}
            </button>
          );
        })}
      </div>
    </section>
  );
}
