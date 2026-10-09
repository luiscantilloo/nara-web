import type { ReactNode } from "react";

/** Contenedor visual compartido de cada casilla en Herramientas. */
export function ToolCardShell({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const className =
    "flex aspect-square min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-linea px-4 py-5 text-center sm:min-h-[160px]";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}
