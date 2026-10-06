"use client";

import type { InputHTMLAttributes } from "react";

function ColombiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="8" y="0" fill="#FCD116" />
      <rect width="24" height="4" y="8" fill="#003893" />
      <rect width="24" height="4" y="12" fill="#CE1126" />
    </svg>
  );
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Campo de teléfono Colombia: bandera +57 + número. */
export function PhoneInput({ className = "", ...props }: Props) {
  return (
    <div
      className={`flex h-11 w-full items-center gap-2 rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 focus-within:border-[#C4BDB3] ${className}`}
    >
      <ColombiaFlag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]" />
      <span className="shrink-0 select-none font-texto text-[15px] text-texto-secundario">
        +57
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className="h-full min-w-0 flex-1 border-none bg-transparent p-0 font-texto text-[15px] text-nara-tinta outline-none ring-0"
        {...props}
      />
    </div>
  );
}
