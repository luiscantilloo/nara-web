import type { ReactNode } from "react";

/** Contenedor visual compartido: logo + nombre + detalle opcional. */
export function ToolCardShell({
  children,
  onClick,
  logoSrc,
  title,
  disabled = false,
}: {
  children?: ReactNode;
  onClick?: () => void;
  logoSrc?: string;
  title?: string;
  disabled?: boolean;
}) {
  const className = [
    "flex aspect-square min-h-0 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-linea px-1.5 py-2 text-center",
    disabled
      ? "cursor-not-allowed opacity-45 grayscale"
      : onClick
        ? "cursor-pointer"
        : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt=""
          className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
        />
      ) : null}
      {title ? (
        <span className="line-clamp-2 max-w-full text-[10px] font-medium leading-tight text-nara-tinta sm:text-[11px]">
          {title}
        </span>
      ) : null}
      {children ? (
        <div className="flex max-w-full flex-col items-center gap-0.5 [&_span]:max-w-full [&_span]:text-[9px] [&_span]:leading-tight [&_span]:text-texto-secundario">
          {children}
        </div>
      ) : null}
    </>
  );

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return (
    <div
      className={className}
      aria-disabled={disabled || undefined}
      title={disabled ? "Próximamente" : undefined}
    >
      {body}
    </div>
  );
}
