import { logoForHerramienta } from "@/modules/clinico/herramientas/toolLogos";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

type NavItem = PacienteHerramientaMeta & {
  on: boolean;
  go: () => void;
  disabled?: boolean;
};

function NavIcon({
  id,
  active,
  disabled,
}: {
  id: PacienteHerramientaId;
  active: boolean;
  disabled?: boolean;
}) {
  const src = logoForHerramienta(id);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={`h-7 w-7 object-contain ${
        disabled
          ? "opacity-40 grayscale"
          : active
            ? "opacity-100"
            : "opacity-70"
      }`}
    />
  );
}

/**
 * Barra inferior: las 6 herramientas.
 * tech / revisit / cursos en gris (próximamente), mismos logos que el clínico.
 */
export function PacienteHerramientasNav({ items }: { items: NavItem[] }) {
  const n = items.length;
  if (!n) return null;

  const labelClass =
    n >= 6
      ? "text-[9px] leading-tight sm:text-[10px]"
      : n >= 5
        ? "text-[10px] leading-tight sm:text-[11px]"
        : n >= 4
          ? "text-[11px] leading-tight sm:text-[12px]"
          : "text-[13px] leading-tight";

  return (
    <div
      role="tablist"
      className="grid w-full shrink-0 border-t border-linea bg-nara-blanco px-0.5 pt-1.5"
      style={{
        paddingBottom: 10,
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
      }}
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.on}
          aria-disabled={t.disabled || undefined}
          disabled={t.disabled}
          onClick={t.go}
          title={t.disabled ? "Próximamente" : t.name}
          className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-0.5 font-texto outline-none after:pointer-events-none after:absolute after:right-1 after:bottom-0 after:left-1 after:h-[3px] after:content-[''] ${
            t.disabled
              ? "cursor-not-allowed text-texto-secundario/50 after:bg-transparent"
              : t.on
                ? "cursor-pointer font-semibold text-nara-tinta after:bg-[#FDCD22]"
                : "cursor-pointer font-medium text-texto-secundario after:bg-transparent"
          }`}
        >
          <span className="grid h-7 place-items-center">
            <NavIcon id={t.id} active={t.on} disabled={t.disabled} />
          </span>
          <span className={`max-w-full truncate text-center ${labelClass}`}>
            {t.navLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
