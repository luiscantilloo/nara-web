"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminNav, isAdminNavCompact } from "@/components/shared/admin-nav/AdminNav";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";

type Props = {
  active: string;
  onOpenAgent: () => void;
  screenCode?: string;
  /** TEO abierto: ayuda a compactar si hace falta. */
  agentOpen?: boolean;
};

export function AdminTopbar({ active, onOpenAgent, screenCode, agentOpen = false }: Props) {
  const headerRef = useRef<HTMLElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setBarWidth(w);
    });
    ro.observe(el);
    setBarWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const forceCompact = agentOpen && barWidth > 0 && barWidth < 1280;
  const compact = isAdminNavCompact(barWidth, forceCompact);

  return (
    <header
      ref={headerRef}
      className="box-border flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-0 bg-nara-blanco px-3 sm:gap-3 sm:px-5 md:px-6"
    >
      <div className="flex h-full min-w-0 items-stretch gap-2 sm:gap-3 md:gap-4">
        {/* Logo solo en desktop; en hamburguesa vive dentro del drawer */}
        {!compact ? (
          <Link href="/inicio" className="flex shrink-0 items-center text-nara-tinta">
            <img
              src="/nara/marca/logo/nara-logo.svg"
              alt="NARA"
              className="block h-7 w-auto sm:h-[34px]"
            />
          </Link>
        ) : null}
        <AdminNav active={active} barWidth={barWidth} forceCompact={forceCompact} />
      </div>
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        {screenCode ? (
          <span className="hidden rounded-[5px] border border-linea px-1.5 py-0.5 font-mono text-[11px] text-texto-secundario xl:inline">
            {screenCode}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onOpenAgent}
          aria-label="Abrir TEO"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-3.5 sm:text-[15px]"
        >
          <img
            src="/nara/marca/logo/teo-isotipo.svg"
            alt=""
            className="block h-7 w-7 sm:-ml-1.5 sm:h-8 sm:w-8"
          />
          <span className="hidden sm:inline">TEO</span>
        </button>
        <UserMenu notifKey="admin" />
      </div>
    </header>
  );
}
