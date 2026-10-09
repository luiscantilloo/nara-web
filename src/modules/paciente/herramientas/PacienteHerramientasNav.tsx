import { naraAsset } from "@/modules/paciente/app/naraAsset";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

type NavItem = PacienteHerramientaMeta & {
  on: boolean;
  go: () => void;
};

function NavIcon({
  id,
  active,
  opacity = 1,
}: {
  id: PacienteHerramientaId;
  active: boolean;
  opacity?: number;
}) {
  const stroke = active ? "#161413" : "#5E5750";
  if (id === "mood") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    );
  }
  if (id === "ia") {
    return (
      <img
        src={naraAsset("marca/logo/teo-isotipo.svg")}
        alt=""
        style={{ width: 26, height: 26, display: "block", opacity }}
      />
    );
  }
  if (id === "cursos") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="6" cy="19" r="2.2" />
        <circle cx="18" cy="5" r="2.2" />
        <path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8" />
      </svg>
    );
  }
  if (id === "clin") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-6.5-4.3-6.5-10A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 18.5 11c0 5.7-6.5 10-6.5 10z" />
        <path d="M12 8v6M9 11h6" />
      </svg>
    );
  }
  if (id === "tech") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }
  // revisit
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

/**
 * Barra inferior: un botón por servicio activo (hasta 6).
 * Icono + título, tipografía adaptable.
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
          onClick={t.go}
          title={t.name}
          className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-0.5 font-texto outline-none after:pointer-events-none after:absolute after:right-1 after:bottom-0 after:left-1 after:h-[3px] after:content-[''] ${
            t.on
              ? "font-semibold text-nara-tinta after:bg-[#FDCD22]"
              : "font-medium text-texto-secundario after:bg-transparent"
          }`}
        >
          <span className="grid h-7 place-items-center">
            <NavIcon id={t.id} active={t.on} opacity={t.on ? 1 : 0.7} />
          </span>
          <span className={`max-w-full truncate text-center ${labelClass}`}>
            {t.navLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
