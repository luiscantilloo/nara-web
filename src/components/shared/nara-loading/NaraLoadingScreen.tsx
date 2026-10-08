"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Carga a pantalla completa (entrada paciente): rosa + isotipo centrado.
 * Portal a body para cubrir topbar, shell y cualquier stacking context.
 */
export function NaraLoadingScreen({
  className = "",
}: {
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const node = (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando NARA"
      className={`grid place-items-center bg-nara-rosa ${className}`.trim()}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 99999,
        width: "100vw",
        height: "100dvh",
        minWidth: "100%",
        minHeight: "100%",
        margin: 0,
        background: "#FFA3D0",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        className="grid size-[148px] place-items-center rounded-[40px] bg-nara-crema"
        style={{
          width: 148,
          height: 148,
          borderRadius: 40,
          background: "#F0ECE6",
          display: "grid",
          placeItems: "center",
        }}
      >
        <img
          src="/nara/marca/logo/nara-isotipo.svg"
          alt="NARA"
          width={112}
          height={112}
          className="block size-28"
          style={{ width: 112, height: 112, display: "block" }}
        />
      </div>
    </div>
  );

  if (!mounted) {
    return node;
  }

  return createPortal(node, document.body);
}
